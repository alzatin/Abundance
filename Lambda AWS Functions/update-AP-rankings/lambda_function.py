import os
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal


def compute_molecule_usage_counts(items):
    """Returns a dict mapping repo_id to usage count."""
    usage_counts = {}
    for item in items:
        print(item)
        molecules = item.get("githubMoleculesUsed", [])
        print(molecules)
        for molecule in molecules:
            print(molecule)
            if molecule:
                repo_id = f"{molecule['owner']}/{molecule['repoName']}"
                usage_counts[repo_id] = usage_counts.get(repo_id, 0) + 1
    return usage_counts


def tally_likes_from_user_table(dynamodb, user_table_name):
    user_table = dynamodb.Table(user_table_name)
    likes_count = {}
    response = user_table.scan(ProjectionExpression="likedProjects")
    items = response.get("Items", [])
    while "LastEvaluatedKey" in response:
        response = user_table.scan(
            ProjectionExpression="likedProjects",
            ExclusiveStartKey=response["LastEvaluatedKey"]
        )
        items.extend(response.get("Items", []))
    for user in items:
        liked_projects = user.get("likedProjects", [])
        for proj in liked_projects:
            owner = None
            repo_name = None
            if isinstance(proj, dict):
                owner = proj.get("owner")
                repo_name = proj.get("repoName")
            elif isinstance(proj, str) and "/" in proj:
                owner, repo_name = proj.split("/", 1)

            if not owner or not repo_name:
                missing = []
                if not owner:
                    missing.append("owner")
                if not repo_name:
                    missing.append("repoName")

                print(
                    f"Skipping invalid liked project (missing {', '.join(missing)}): {proj}")
                continue
            key = (owner, repo_name)
            likes_count[key] = likes_count.get(key, 0) + 1
    # After likes_count is built
    top_liked = sorted(likes_count.items(),
                       key=lambda x: x[1], reverse=True)[:3]
    print("Top 3 liked projects:")
    for (owner, repo_name), count in top_liked:
        print(f"{owner}/{repo_name}: {count} likes")
    return likes_count


def get_molecule_usage_for_project(owner, repo_name, usage_counts):
    repo_id = f"{owner}/{repo_name}"
    return usage_counts.get(repo_id, 0)


def calculate_ranking(item, molecule_usage):
    # Ensure all values are Decimal for DynamoDB compatibility
    likes = Decimal(str(item.get("likes", 0)))
    forks = Decimal(str(item.get("forks", 0)))
    molecule_usage = Decimal(str(molecule_usage))
    # Use Decimal for all constants and new formula
    ranking = Decimal('2') * likes + Decimal('0.3') * \
        molecule_usage + Decimal('0.2') * forks
    return ranking


def lambda_handler(event, context):
    dynamodb = boto3.resource("dynamodb")
    table_name = os.environ["TABLE_NAME"]
    user_table_name = os.environ["USER_TABLE"]
    table = dynamodb.Table(table_name)

    # 1. Scan all items
    items = []
    response = table.scan()
    items.extend(response.get("Items", []))
    while "LastEvaluatedKey" in response:
        response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
        items.extend(response.get("Items", []))

    # 2. Compute molecule usage counts
    molecule_usage_counts = compute_molecule_usage_counts(items)

    # 3. Tally likes from user table
    likes_count = tally_likes_from_user_table(dynamodb, user_table_name)

    updated = 0
    for item in items:
        owner = item["owner"]
        repo_name = item["repoName"]
        # Skip the specific project
        if owner == "alzatin" and repo_name == "My-First-Project":
            print(f"Skipping project {owner}/{repo_name} as requested.")
            continue
        molecule_usage = get_molecule_usage_for_project(
            owner, repo_name, molecule_usage_counts)
        # Use the tally from the user table
        likes = likes_count.get((owner, repo_name), 0)
        forks = item.get("forks", 0)

        molecule_usage = float(molecule_usage)
        item_for_ranking = {"likes": likes, "forks": forks}
        ranking = calculate_ranking(item_for_ranking, molecule_usage)

        if ranking > 0:
            print(f"Would update ranking for {owner}/{repo_name} to {ranking}")
            # 4. Update ranking attribute for this item
            table.update_item(
                Key={"owner": owner, "repoName": repo_name},
                UpdateExpression="SET ranking = :r, likes = :l",
                ExpressionAttributeValues={":r": ranking, ":l": likes},
            )
        updated += 1

    print(f"Updated ranking for {updated} projects.")
    return {
        "statusCode": 200,
        "body": f"Updated ranking for {updated} projects."
    }
