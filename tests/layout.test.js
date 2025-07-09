// Layout functionality integration tests
import { 
  library, 
  started, 
  circle, 
  rectangle, 
  extrude, 
  layout,
  tag
} from '../src/worker.js';

describe('layout with previous placements', () => {
  beforeAll(async () => {
    // Wait on worker's started flag.
    await started;
  });

  afterEach(() => {
    // Reset library after each test
    for (const key of Object.keys(library)) {
      delete library[key];
    }
  });

  it('accepts previous placements parameter without errors', async () => {
    // Create some simple 2D shapes to layout
    const rect1ID = 'rect1';
    const rect2ID = 'rect2';
    const targetID = 'layout_result';
    
    // Create two rectangles
    await rectangle(rect1ID, 10, 5);
    await rectangle(rect2ID, 8, 4);
    
    // Tag them for cutting  
    await tag(rect1ID + '_tagged', rect1ID, 'cut');
    await tag(rect2ID + '_tagged', rect2ID, 'cut');
    
    // Create an assembly with both tagged parts - use the proper structure
    const assembly = {
      geometry: [{
        geometry: [library[rect1ID + '_tagged']],
        color: '#888888',
        plane: null,
        tags: ['cut'],
        bom: []
      }, {
        geometry: [library[rect2ID + '_tagged']],
        color: '#888888',
        plane: null,
        tags: ['cut'],
        bom: []
      }],
      color: '#888888',
      plane: null,
      tags: [],
      bom: []
    };
    
    library['assembly'] = assembly;

    const layoutConfig = {
      width: 100,
      height: 100,
      partPadding: 2,
      units: 'MM'
    };

    // First layout call without previous placements
    const progressCallback = (progress, cancelationHandle) => {
      console.log('Progress:', progress);
    };
    const warningCallback = (message) => {
      console.log('Warning:', message);
    };
    
    let placementsReceived = [];
    const placementsCallback = (placements) => {
      placementsReceived = placements;
      console.log('Placements received:', placements);
    };

    // Test that layout function accepts the new parameter structure
    await expect(
      layout(
        targetID,
        'assembly',
        progressCallback,
        warningCallback,
        placementsCallback,
        layoutConfig,
        null // No previous placements for first run
      )
    ).resolves.not.toThrow();

    // Verify result was created
    expect(library[targetID]).toBeDefined();
    
    // Now test with previous placements (using mock placements)
    const previousPlacements = [
      [
        { id: 0, rotate: 0, translate: { x: 10, y: 10 } },
        { id: 1, rotate: 90, translate: { x: 30, y: 20 } }
      ]
    ];

    const targetID2 = 'layout_result_2';
    
    await expect(
      layout(
        targetID2,
        'assembly',
        progressCallback,
        warningCallback,
        placementsCallback,
        layoutConfig,
        previousPlacements // Pass previous placements
      )
    ).resolves.not.toThrow();

    // Verify second result was created
    expect(library[targetID2]).toBeDefined();
  });
});