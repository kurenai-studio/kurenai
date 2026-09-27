import { EventKeyboard } from '@cocos/engine/cocos/input/types';
import { EventTarget } from '@cocos/engine/cocos/core/event';
import { code2KeyCode } from '../keycodes.js';

function getKeyCode(code) {
    return code2KeyCode[code] || 0;
}

function isEditableTarget(target) {
    if (!target || typeof target !== 'object') return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

class KeyboardInputSource {
    _ccprivate$_eventTarget = new EventTarget();

    constructor() {
        this._ccprivate$_registerEvent();
    }

    dispatchKeyboardDownEvent(nativeKeyboardEvent) {
        this._ccprivate$_handleKeyboardDown(nativeKeyboardEvent);
    }

    dispatchKeyboardUpEvent(nativeKeyboardEvent) {
        this._ccprivate$_handleKeyboardUp(nativeKeyboardEvent);
    }

    on(eventType, callback, target) {
        this._ccprivate$_eventTarget.on(eventType, callback, target);
    }

    /**
     * Bind on `window` instead of `#GameCanvas`:
     * - Canvas may not exist yet when Input constructs (optional-chain used to swallow that).
     * - Preview canvas uses tabindex=-1 and often never receives focus, so key events never fire.
     */
    _ccprivate$_registerEvent() {
        const down = (event) => {
            if (isEditableTarget(event.target)) return;
            this._ccprivate$_handleKeyboardDown(event);
        };
        const up = (event) => {
            if (isEditableTarget(event.target)) return;
            this._ccprivate$_handleKeyboardUp(event);
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);

        // Keep canvas focusable when it appears so other code that still targets canvas works.
        const ensureCanvasFocusable = () => {
            const canvas = document.getElementById('GameCanvas');
            if (canvas && canvas.tabIndex < 0) canvas.tabIndex = 0;
        };
        ensureCanvasFocusable();
        if (!document.getElementById('GameCanvas') && typeof MutationObserver === 'function') {
            const observer = new MutationObserver(() => {
                if (!document.getElementById('GameCanvas')) return;
                observer.disconnect();
                ensureCanvasFocusable();
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        }
    }

    _ccprivate$_getInputEvent(event, eventType) {
        const keyCode = getKeyCode(event.code);
        return new EventKeyboard(keyCode, eventType);
    }

    _ccprivate$_handleKeyboardDown(event) {
        event.stopPropagation();
        event.preventDefault();
        if (!event.repeat) {
            this._ccprivate$_eventTarget.emit('keydown', this._ccprivate$_getInputEvent(event, 'keydown'));
        } else {
            this._ccprivate$_eventTarget.emit('key-pressing', this._ccprivate$_getInputEvent(event, 'key-pressing'));
        }
    }

    _ccprivate$_handleKeyboardUp(event) {
        event.stopPropagation();
        event.preventDefault();
        this._ccprivate$_eventTarget.emit('keyup', this._ccprivate$_getInputEvent(event, 'keyup'));
    }
}

export { KeyboardInputSource };
