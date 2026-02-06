/**
 * Input System
 * Unified input handling for keyboard, gamepad, and touch controls
 */

import { GAMEPAD, INPUT_DEVICE } from '../utils/Constants.js';

export class InputSystem {
  constructor() {
    // Keyboard state
    this.keys = {};
    
    // Gamepad state
    this.gamepadIndex = null;
    this.gamepadConnected = false;
    this.gamepadDeadzone = GAMEPAD.DEADZONE;
    
    // Touch state
    this.touchActive = false;
    this.joystickX = 0;
    this.joystickY = 0;
    this.shopPressed = false;
    
    // Input device tracking
    this.currentDevice = INPUT_DEVICE.KEYBOARD;
    this.lastSwitchTime = 0;
    this.switchCooldown = INPUT_DEVICE.SWITCH_COOLDOWN;
    
    // Previous button states for edge detection
    this.prevDashPressed = false;
    this.prevBreakPressed = false;
    
    this._setupKeyboardListeners();
    this._setupGamepadListeners();
    this._setupTouchListeners();
  }

  /**
   * Setup keyboard event listeners
   * @private
   */
  _setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      
      // Handle Control keys
      if (e.key === 'Control') {
        if (e.location === 1) {
          this.keys['leftctrl'] = true;
        } else if (e.location === 2) {
          this.keys['rightctrl'] = true;
        } else {
          this.keys['leftctrl'] = true;
        }
      }
      
      // Handle Shift keys
      if (e.key === 'Shift') {
        if (e.location === 1) {
          this.keys['leftshift'] = true;
        } else if (e.location === 2) {
          this.keys['rightshift'] = true;
        } else {
          this.keys['leftshift'] = true;
        }
      }
      
      // Detect keyboard input
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'b'].includes(e.key.toLowerCase())) {
        if (!e.repeat) {
          this._switchDevice(INPUT_DEVICE.KEYBOARD);
        }
      }
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      
      if (e.key === 'Control') {
        if (e.location === 1) {
          this.keys['leftctrl'] = false;
        } else if (e.location === 2) {
          this.keys['rightctrl'] = false;
        } else {
          this.keys['leftctrl'] = false;
        }
      }
      
      if (e.key === 'Shift') {
        if (e.location === 1) {
          this.keys['leftshift'] = false;
        } else if (e.location === 2) {
          this.keys['rightshift'] = false;
        } else {
          this.keys['leftshift'] = false;
        }
      }
    });
  }

  /**
   * Setup gamepad event listeners
   * @private
   */
  _setupGamepadListeners() {
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad.id);
      this.gamepadIndex = e.gamepad.index;
      this.gamepadConnected = true;
      this._emitControllerEvent('connected', e.gamepad.id);
    });
    
    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('Gamepad disconnected');
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
        this.gamepadConnected = false;
        this._emitControllerEvent('disconnected', e.gamepad.id);
      }
    });
  }

  /**
   * Setup touch event listeners
   * @private
   */
  _setupTouchListeners() {
    if (!this._isTouchDevice()) return;
    
    this._setupVirtualJoystick();
    this._setupTouchButtons();
  }

  /**
   * Check if device supports touch
   * @private
   */
  _isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Setup virtual joystick
   * @private
   */
  _setupVirtualJoystick() {
    const joystick = document.getElementById('virtual-joystick');
    if (!joystick) return;
    
    const joystickHandle = document.getElementById('joystick-handle');
    if (!joystickHandle) return;
    
    const joystickRadius = 35;
    let joystickTouchId = null;
    let joystickCenter = { x: 0, y: 0 };
    
    const updateJoystick = (clientX, clientY) => {
      const dx = clientX - joystickCenter.x;
      const dy = clientY - joystickCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const clampedDistance = Math.min(distance, joystickRadius);
      const angle = Math.atan2(dy, dx);
      
      const handleX = Math.cos(angle) * clampedDistance;
      const handleY = Math.sin(angle) * clampedDistance;
      
      joystickHandle.style.transform = `translate(calc(-50% + ${handleX}px), calc(-50% + ${handleY}px))`;
      
      this.joystickX = handleX / joystickRadius;
      this.joystickY = handleY / joystickRadius;
    };
    
    const resetJoystick = () => {
      joystickHandle.style.transform = 'translate(-50%, -50%)';
      this.joystickX = 0;
      this.joystickY = 0;
    };
    
    joystick.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      joystickTouchId = touch.identifier;
      
      const rect = joystick.getBoundingClientRect();
      joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      
      updateJoystick(touch.clientX, touch.clientY);
      this.touchActive = true;
      this._switchDevice(INPUT_DEVICE.TOUCH);
    }, { passive: false });
    
    joystick.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (touch.identifier === joystickTouchId) {
          updateJoystick(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });
    
    joystick.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (const touch of e.changedTouches) {
        if (touch.identifier === joystickTouchId) {
          joystickTouchId = null;
          resetJoystick();
          break;
        }
      }
    }, { passive: false });
    
    joystick.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      joystickTouchId = null;
      resetJoystick();
    }, { passive: false });
  }

  /**
   * Setup touch buttons
   * @private
   */
  _setupTouchButtons() {
    const shopBtn = document.getElementById('touch-shop-btn');
    if (!shopBtn) return;
    
    shopBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.shopPressed = true;
      this.touchActive = true;
      this._switchDevice(INPUT_DEVICE.TOUCH);
    }, { passive: false });
    
    shopBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.shopPressed = false;
    }, { passive: false });
    
    shopBtn.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      this.shopPressed = false;
    }, { passive: false });
  }

  /**
   * Switch input device
   * @private
   */
  _switchDevice(device) {
    const now = Date.now();
    if (now - this.lastSwitchTime < this.switchCooldown) return;
    if (this.currentDevice === device) return;
    
    this.currentDevice = device;
    this.lastSwitchTime = now;
    
    // Emit device change event
    window.dispatchEvent(new CustomEvent('inputDeviceChanged', { detail: { device } }));
  }

  /**
   * Emit controller connection event
   * @private
   */
  _emitControllerEvent(type, gameId) {
    window.dispatchEvent(new CustomEvent('controllerStatusChanged', { 
      detail: { type, gameId } 
    }));
  }

  /**
   * Get gamepad input state
   * @private
   */
  _getGamepadInput() {
    if (!this.gamepadConnected || this.gamepadIndex === null) {
      return { x: 0, y: 0, aPressed: false, bPressed: false, startPressed: false, r1Pressed: false, l1Pressed: false, r2Pressed: 0, l2Pressed: 0 };
    }
    
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[this.gamepadIndex];
    
    if (!gamepad) {
      return { x: 0, y: 0, aPressed: false, bPressed: false, startPressed: false, r1Pressed: false, l1Pressed: false, r2Pressed: 0, l2Pressed: 0 };
    }
    
    // Check if gamepad input is active
    const hasGamepadInput = gamepad.axes.some(axis => Math.abs(axis) > this.gamepadDeadzone) ||
                            gamepad.buttons.some(button => button.pressed);
    if (hasGamepadInput) {
      this._switchDevice(INPUT_DEVICE.GAMEPAD);
    }
    
    const isButtonPressed = (index) => {
      return gamepad.buttons[index] && gamepad.buttons[index].pressed;
    };
    
    let x = 0, y = 0;
    
    // Left stick
    if (Math.abs(gamepad.axes[0]) > this.gamepadDeadzone) x = gamepad.axes[0];
    if (Math.abs(gamepad.axes[1]) > this.gamepadDeadzone) y = gamepad.axes[1];
    
    // Right stick as alternative
    if (x === 0 && y === 0) {
      if (Math.abs(gamepad.axes[2]) > this.gamepadDeadzone) x = gamepad.axes[2];
      if (Math.abs(gamepad.axes[3]) > this.gamepadDeadzone) y = gamepad.axes[3];
    }
    
    // D-pad
    if (x === 0 && y === 0) {
      if (isButtonPressed(GAMEPAD.BUTTONS.LEFT)) x = -1;
      if (isButtonPressed(GAMEPAD.BUTTONS.RIGHT)) x = 1;
      if (isButtonPressed(GAMEPAD.BUTTONS.UP)) y = -1;
      if (isButtonPressed(GAMEPAD.BUTTONS.DOWN)) y = 1;
    }
    
    // Triggers
    let r2Trigger = 0;
    let l2Trigger = 0;
    
    if (gamepad.buttons[GAMEPAD.BUTTONS.R2] && gamepad.buttons[GAMEPAD.BUTTONS.R2].value !== undefined) {
      r2Trigger = gamepad.buttons[GAMEPAD.BUTTONS.R2].value;
    }
    if (gamepad.buttons[GAMEPAD.BUTTONS.L2] && gamepad.buttons[GAMEPAD.BUTTONS.L2].value !== undefined) {
      l2Trigger = gamepad.buttons[GAMEPAD.BUTTONS.L2].value;
    }
    
    if (r2Trigger === 0 && gamepad.axes.length > 5) {
      r2Trigger = (gamepad.axes[5] + 1) / 2;
    }
    if (l2Trigger === 0 && gamepad.axes.length > 4) {
      l2Trigger = (gamepad.axes[4] + 1) / 2;
    }
    
    return {
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
      aPressed: isButtonPressed(GAMEPAD.BUTTONS.A),
      bPressed: isButtonPressed(GAMEPAD.BUTTONS.B),
      startPressed: isButtonPressed(GAMEPAD.BUTTONS.START) || isButtonPressed(GAMEPAD.BUTTONS.SELECT),
      r1Pressed: isButtonPressed(GAMEPAD.BUTTONS.R1),
      l1Pressed: isButtonPressed(GAMEPAD.BUTTONS.L1),
      r2Pressed: Math.max(0, Math.min(1, r2Trigger)),
      l2Pressed: Math.max(0, Math.min(1, l2Trigger))
    };
  }

  /**
   * Get unified input state
   * @returns {Object} Input state with movement, dash, break, and zoom controls
   */
  getInput() {
    let x = 0, y = 0;
    let dashPressed = false;
    let breakPressed = false;
    let zoomInPressed = false;
    let zoomOutPressed = false;
    
    // Keyboard input
    if (this.keys['w'] || this.keys['arrowup']) y -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) y += 1;
    if (this.keys['a'] || this.keys['arrowleft']) x -= 1;
    if (this.keys['d'] || this.keys['arrowright']) x += 1;
    
    if (this.keys['rightctrl']) dashPressed = true;
    if (this.keys['leftctrl']) breakPressed = true;
    if (this.keys['rightshift']) zoomInPressed = true;
    if (this.keys['leftshift']) zoomOutPressed = true;
    
    // Gamepad input (overrides keyboard)
    const gamepadInput = this._getGamepadInput();
    if (gamepadInput.x !== 0 || gamepadInput.y !== 0) {
      x = gamepadInput.x;
      y = gamepadInput.y;
    }
    if (gamepadInput.r1Pressed) dashPressed = true;
    if (gamepadInput.l1Pressed) breakPressed = true;
    
    // Touch input (highest priority)
    if (this.touchActive && (this.joystickX !== 0 || this.joystickY !== 0)) {
      x = this.joystickX;
      y = this.joystickY;
    }
    
    return {
      x,
      y,
      dashPressed,
      breakPressed,
      zoomInPressed,
      zoomOutPressed,
      r2Value: gamepadInput.r2Pressed,
      l2Value: gamepadInput.l2Pressed,
      shopPressed: this.shopPressed || gamepadInput.bPressed,
      aPressed: gamepadInput.aPressed,
      bPressed: gamepadInput.bPressed,
      startPressed: gamepadInput.startPressed
    };
  }

  /**
   * Get current input device type
   * @returns {string} Current device type
   */
  getCurrentDevice() {
    return this.currentDevice;
  }

  /**
   * Check if shop button was pressed this frame
   * @param {Object} input - Current input state
   * @returns {boolean} True if shop button was just pressed
   */
  isShopJustPressed(input) {
    return input.shopPressed;
  }

  /**
   * Cleanup
   */
  dispose() {
    // Event listeners are automatically cleaned up when elements are removed
    this.keys = {};
    this.gamepadIndex = null;
    this.gamepadConnected = false;
  }
}
