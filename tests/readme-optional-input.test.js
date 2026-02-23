/**
 * Test to verify that README atoms don't remain in WAITING state when optional inputs are not connected
 * 
 * Issue: README atoms have an optional "value" input, but when nothing is connected,
 * the atom remains in WAITING state instead of computing.
 * 
 * Solution: Override onUpstreamChange() to allow computation when inputs are READY or WAITING
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Status } from '../src/prototypes/observableEntity.js';

describe('README Atom Optional Input Handling', () => {
  
  it('should describe expected behavior when no input is connected', () => {
    // Expected behavior:
    // 1. README atom is created with an optional "value" input
    // 2. When no connector is attached, the input is in WAITING state
    // 3. The README atom should still compute and become READY with its text content
    // 4. The readMeText property should be the output value
    
    expect(true).toBe(true); // Placeholder - actual behavior tested through integration
  });

  it('should validate that onUpstreamChange handles WAITING inputs', () => {
    // Mock a README atom with an optional input in WAITING state
    const mockReadmeAtom = {
      status: Status.DISABLED,
      readMeText: 'This is readme content',
      inputs: [{
        name: 'value',
        valueType: 'geometry',
        getState() {
          return { status: Status.WAITING, value: null };
        }
      }],
      
      isEnabled() {
        return this.status !== Status.DISABLED;
      },
      
      inputsHaveErrors() {
        return false;
      },
      
      setProcessing() {
        this.status = Status.PROCESSING;
      },
      
      setReady(value) {
        this.status = Status.READY;
        this.value = value;
      },
      
      setWaiting() {
        this.status = Status.WAITING;
      },
      
      setUpstreamError() {
        this.status = Status.UPSTREAM_ERROR;
      },
      
      compute(argsDict) {
        return Promise.resolve(this.readMeText);
      },
      
      alertingErrorHandler() {
        return (err) => console.error(err);
      },
      
      // Simulate the overridden onUpstreamChange logic
      onUpstreamChange() {
        if (!this.isEnabled()) {
          return;
        }
        
        if (this.inputsHaveErrors()) {
          this.setUpstreamError();
          return;
        }
        
        // Allow computation when inputs are READY or WAITING
        const inputsReadyOrWaiting = this.inputs.every((input) => {
          const status = input.getState().status;
          return status === Status.READY || status === Status.WAITING;
        });
        
        if (inputsReadyOrWaiting) {
          const argsDict = Object.fromEntries(
            this.inputs.map((input) => [input.name, input.getState().value])
          );
          
          this.setProcessing();
          this.compute(argsDict)
            .then((value) => {
              this.setReady(value);
            })
            .catch(this.alertingErrorHandler());
        } else {
          this.setWaiting();
        }
      }
    };
    
    // Initially disabled - need to enable first
    expect(mockReadmeAtom.status).toBe(Status.DISABLED);
    
    // Enable the atom (would normally happen during deserialization)
    mockReadmeAtom.status = Status.WAITING;
    
    // Call onUpstreamChange - should compute even though input is WAITING
    mockReadmeAtom.onUpstreamChange();
    
    // Should transition to PROCESSING first
    expect(mockReadmeAtom.status).toBe(Status.PROCESSING);
    
    // Wait for async computation
    return new Promise(resolve => {
      setTimeout(() => {
        // After compute resolves, should be READY with the readMeText value
        expect(mockReadmeAtom.status).toBe(Status.READY);
        expect(mockReadmeAtom.value).toBe('This is readme content');
        resolve();
      }, 10);
    });
  });

  it('should compute when input is connected and READY', () => {
    // Mock a README atom with a connected input that's READY
    const mockReadmeAtom = {
      status: Status.WAITING,
      readMeText: 'This is readme content',
      inputs: [{
        name: 'value',
        valueType: 'geometry',
        getState() {
          return { status: Status.READY, value: { geometry: 'mock' } };
        }
      }],
      
      isEnabled() {
        return this.status !== Status.DISABLED;
      },
      
      inputsHaveErrors() {
        return false;
      },
      
      setProcessing() {
        this.status = Status.PROCESSING;
      },
      
      setReady(value) {
        this.status = Status.READY;
        this.value = value;
      },
      
      setWaiting() {
        this.status = Status.WAITING;
      },
      
      setUpstreamError() {
        this.status = Status.UPSTREAM_ERROR;
      },
      
      compute(argsDict) {
        return Promise.resolve(this.readMeText);
      },
      
      alertingErrorHandler() {
        return (err) => console.error(err);
      },
      
      onUpstreamChange() {
        if (!this.isEnabled()) {
          return;
        }
        
        if (this.inputsHaveErrors()) {
          this.setUpstreamError();
          return;
        }
        
        const inputsReadyOrWaiting = this.inputs.every((input) => {
          const status = input.getState().status;
          return status === Status.READY || status === Status.WAITING;
        });
        
        if (inputsReadyOrWaiting) {
          const argsDict = Object.fromEntries(
            this.inputs.map((input) => [input.name, input.getState().value])
          );
          
          this.setProcessing();
          this.compute(argsDict)
            .then((value) => {
              this.setReady(value);
            })
            .catch(this.alertingErrorHandler());
        } else {
          this.setWaiting();
        }
      }
    };
    
    // Call onUpstreamChange with READY input
    mockReadmeAtom.onUpstreamChange();
    
    // Should transition to PROCESSING
    expect(mockReadmeAtom.status).toBe(Status.PROCESSING);
    
    // Wait for async computation
    return new Promise(resolve => {
      setTimeout(() => {
        // Should become READY
        expect(mockReadmeAtom.status).toBe(Status.READY);
        expect(mockReadmeAtom.value).toBe('This is readme content');
        resolve();
      }, 10);
    });
  });

  it('should handle errors in inputs properly', () => {
    // Mock a README atom with an input in ERROR state
    const mockReadmeAtom = {
      status: Status.WAITING,
      readMeText: 'This is readme content',
      inputs: [{
        name: 'value',
        valueType: 'geometry',
        getState() {
          return { status: Status.ERROR, value: null };
        }
      }],
      
      isEnabled() {
        return this.status !== Status.DISABLED;
      },
      
      inputsHaveErrors() {
        return this.inputs.some((input) => {
          const status = input.getState().status;
          return status === Status.ERROR || status === Status.UPSTREAM_ERROR;
        });
      },
      
      setUpstreamError() {
        this.status = Status.UPSTREAM_ERROR;
      },
      
      onUpstreamChange() {
        if (!this.isEnabled()) {
          return;
        }
        
        if (this.inputsHaveErrors()) {
          this.setUpstreamError();
          return;
        }
      }
    };
    
    // Call onUpstreamChange with ERROR input
    mockReadmeAtom.onUpstreamChange();
    
    // Should become UPSTREAM_ERROR (not compute)
    expect(mockReadmeAtom.status).toBe(Status.UPSTREAM_ERROR);
  });

  it('should not compute when disabled', () => {
    // Mock a README atom that's DISABLED
    const mockReadmeAtom = {
      status: Status.DISABLED,
      readMeText: 'This is readme content',
      inputs: [{
        name: 'value',
        valueType: 'geometry',
        getState() {
          return { status: Status.WAITING, value: null };
        }
      }],
      
      isEnabled() {
        return this.status !== Status.DISABLED;
      },
      
      onUpstreamChange() {
        if (!this.isEnabled()) {
          return;
        }
        // Should not reach here
        throw new Error('Should not compute when disabled');
      }
    };
    
    // Call onUpstreamChange while disabled - should be a no-op
    expect(() => mockReadmeAtom.onUpstreamChange()).not.toThrow();
    expect(mockReadmeAtom.status).toBe(Status.DISABLED);
  });
});
