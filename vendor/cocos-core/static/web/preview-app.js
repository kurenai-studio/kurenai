/* global window, document, cc */

function log(msg, level) {
    if (level === 'err') console.error('[Preview]', msg);
    else if (level === 'warn') console.warn('[Preview]', msg);
    else console.log('[Preview]', msg);
}

function getPreviewService() {
    try {
        return window.cli && window.cli.Scene && window.cli.Scene.Preview;
    } catch (e) {
        return null;
    }
}

function getActive() {
    var preview = getPreviewService();
    return preview && preview.activePreview;
}

// ── Preview execution ──

async function doPreview() {
    var preview = getPreviewService();
    if (!preview) {
        log('Preview service not ready', 'err');
        return null;
    }

    var uuid = document.getElementById('pvUuid').value.trim();
    var status = document.getElementById('pvStatus');

    if (!uuid) {
        log('UUID is required', 'warn');
        return null;
    }

    status.textContent = 'Loading...';
    log('Preview: uuid=' + uuid);

    try {
        var instance = await preview.open(uuid);
        if (!instance) {
            status.textContent = 'unsupported type';
            return null;
        }
        status.textContent = 'ok';
        refreshViewModeControls();
        return instance;
    } catch (e) {
        log('Preview error: ' + e.message, 'err');
        status.textContent = 'error';
        console.error('Preview error:', e);
        return null;
    }
}

function switchPrimitive(type) {
    var active = getActive();
    if (active && active.switchPrimitive) {
        active.switchPrimitive(type);
        window.cli.Scene.Engine.repaintInEditMode();
        log('Switched primitive: ' + type);
    }
}

function toggleLight() {
    var active = getActive();
    if (!active || !active.setLightEnable) return;
    var light = active.lightComp;
    var on = light ? !light.enabled : true;
    active.setLightEnable(on);
    window.cli.Scene.Engine.repaintInEditMode();
    log('Light: ' + (on ? 'ON' : 'OFF'));
}

function refreshViewModeControls() {
    var active = getActive();
    var is2D = false;
    if (active && active.is2DView) {
        try {
            is2D = !!active.is2DView();
        } catch (e) {
            is2D = false;
        }
    }

    var btn2D = document.getElementById('pvBtn2D');
    var btn3D = document.getElementById('pvBtn3D');
    if (btn2D) btn2D.classList.toggle('active', is2D);
    if (btn3D) btn3D.classList.toggle('active', !is2D);
}

function switch2D3D(targetIs2D) {
    var active = getActive();
    if (!active) {
        log('No active preview', 'warn');
        refreshViewModeControls();
        return;
    }

    var currentIs2D = !!(active.is2DView && active.is2DView());
    var nextIs2D = typeof targetIs2D === 'boolean' ? targetIs2D : !currentIs2D;
    if (active.viewToggle && currentIs2D !== nextIs2D) {
        active.viewToggle();
    }

    window.cli.Scene.Engine.repaintInEditMode();
    refreshViewModeControls();
    log('View mode: ' + (nextIs2D ? '2D' : '3D'));
}

function toggle2D3D(targetIs2D) {
    switch2D3D(targetIs2D);
}

// ── Mouse event forwarding to InteractivePreview ──

function bindPreviewMouseEvents(canvas) {
    canvas.addEventListener('mousedown', function(e) {
        var active = getActive();
        if (active) active.onMouseDown(e);
    });

    canvas.addEventListener('mousemove', function(e) {
        var active = getActive();
        if (!active) return;
        active.onMouseMove(e);
        if (active._isMouseDown) {
            window.cli.Scene.Engine.repaintInEditMode();
        }
    });

    canvas.addEventListener('mouseup', function(e) {
        var active = getActive();
        if (active) active.onMouseUp(e);
    });

    canvas.addEventListener('wheel', function(e) {
        var active = getActive();
        if (!active) return;
        e.preventDefault();
        active.onMouseWheel({
            wheelDeltaY: -e.deltaY,
        });
        window.cli.Scene.Engine.repaintInEditMode();
    }, { passive: false });

    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
}

// ── Initialization ──

export default function initPreviewApp() {
    var status = document.getElementById('pvStatus');

    var preview = getPreviewService();
    if (!preview) {
        status.textContent = 'Service unavailable';
        log('Preview service not found after boot', 'err');
        return;
    }

    try {
        window.cli.Scene.Engine.resume();
    } catch (e) {
        log('Engine resume failed: ' + e.message, 'warn');
    }

    var canvas = document.getElementById('GameCanvas');
    if (canvas) {
        bindPreviewMouseEvents(canvas);
        log('Bound preview mouse events to canvas');
    }

    status.textContent = 'Ready';
    refreshViewModeControls();
    log('Preview service ready');

    // Parse URL params for auto-preview
    var params = new URLSearchParams(window.location.search);
    var uuid = params.get('uuid');

    if (uuid) {
        document.getElementById('pvUuid').value = uuid;
        log('Auto-preview from URL params: uuid=' + uuid);
        setTimeout(function() { doPreview(); }, 100);
    }

    // Expose API for external automation
    window.previewAPI = {
        doPreview: doPreview,
        open: function(uuid) {
            document.getElementById('pvUuid').value = uuid || '';
            return doPreview();
        },
        switchPrimitive: switchPrimitive,
        toggleLight: toggleLight,
        toggle2D3D: toggle2D3D,
    };
}
