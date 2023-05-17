var init = (function () {
    'use strict';

    const ExtensionUtils$2 = imports.misc.extensionUtils;
    const Me$2 = ExtensionUtils$2.getCurrentExtension();
    const GLib$1 = imports.gi.GLib;
    const { byteArray } = imports;
    function get_configuration_dir() {
        const config_dir = GLib$1.build_filenamev([GLib$1.get_user_config_dir(), Me$2.metadata.uuid]);
        if (GLib$1.file_test(config_dir, GLib$1.FileTest.IS_DIR)) {
            return config_dir;
        }
        return GLib$1.build_filenamev([GLib$1.get_user_config_dir(), Me$2.metadata.name]);
    }
    function get_config_path(name) {
        return GLib$1.build_filenamev([get_configuration_dir(), name]);
    }
    function load_config(name) {
        const file_path = get_config_path(name);
        if (!GLib$1.file_test(file_path, GLib$1.FileTest.IS_REGULAR)) {
            return undefined;
        }
        const [loaded, content] = GLib$1.file_get_contents(file_path);
        if (!loaded) {
            return undefined;
        }
        try {
            return JSON.parse(byteArray.toString(content));
        }
        catch (_a) {
            return undefined;
        }
    }

    const Meta = imports.gi.Meta;
    const Shell = imports.gi.Shell;
    const DEFAULT_OPACITY = 255;
    const BLUR_EFFECT_NAME = 'gnome-focus-blur';
    const WINDOW_TYPES = [Meta.WindowType.NORMAL];
    function is_valid_window_type(window) {
        return WINDOW_TYPES.includes(window.get_window_type());
    }
    class GnomeFocusManager {
        constructor(settings, special_focus, ignore_inactive) {
            this.settings = settings;
            this.special_focus = special_focus;
            this.ignore_inactive = ignore_inactive;
            this.is_special = (window_actor) => {
                if (!this.special_focus || window_actor.is_destroyed()) {
                    return false;
                }
                const window = window_actor.get_meta_window();
                return (is_valid_window_type(window) &&
                    this.special_focus.some(criteria => criteria === window.get_wm_class() ||
                        criteria === window.get_wm_class_instance() ||
                        criteria === window.get_title()));
            };
            this.is_ignored = (window_actor) => {
                if (window_actor.is_destroyed()) {
                    return true;
                }
                if (!this.ignore_inactive) {
                    return false;
                }
                const window = window_actor.get_meta_window();
                return (!is_valid_window_type(window) ||
                    this.ignore_inactive.some(criteria => criteria === window.get_wm_class() ||
                        criteria === window.get_wm_class_instance() ||
                        criteria === window.get_title()));
            };
            this.update_inactive_window_actor = (window_actor) => {
                if (window_actor.is_destroyed() || this.is_ignored(window_actor)) {
                    return;
                }
                GnomeFocusManager.set_opacity(window_actor, this.settings.inactive_opacity);
                GnomeFocusManager.set_blur(window_actor, this.settings.is_background_blur, this.settings.blur_sigma);
            };
            this.set_active_window_actor = (window_actor) => {
                if (this.active_window_actor === window_actor) {
                    return;
                }
                if (this.active_window_actor) {
                    this.update_inactive_window_actor(this.active_window_actor);
                    if (this.active_destroy_signal) {
                        this.active_window_actor.disconnect(this.active_destroy_signal);
                        delete this.active_destroy_signal;
                    }
                }
                if (window_actor.is_destroyed() || this.is_ignored(window_actor)) {
                    delete this.active_window_actor;
                    return;
                }
                this.active_window_actor = window_actor;
                const opacity = this.is_special(this.active_window_actor)
                    ? this.settings.special_focus_opacity
                    : this.settings.focus_opacity;
                GnomeFocusManager.set_opacity(this.active_window_actor, opacity);
                GnomeFocusManager.set_blur(this.active_window_actor, this.settings.is_background_blur, this.settings.blur_sigma);
                this.active_destroy_signal = this.active_window_actor.connect('destroy', actor => {
                    if (this.active_window_actor === actor) {
                        delete this.active_window_actor;
                        delete this.active_destroy_signal;
                    }
                });
            };
            this.update_special_focused_window_opacity = (value) => {
                if (undefined === this.active_window_actor || !this.is_special(this.active_window_actor)) {
                    return;
                }
                GnomeFocusManager.set_opacity(this.active_window_actor, value);
            };
            this.update_focused_window_opacity = (value) => {
                if (undefined === this.active_window_actor || this.is_special(this.active_window_actor)) {
                    return;
                }
                GnomeFocusManager.set_opacity(this.active_window_actor, value);
            };
            this.update_inactive_windows_opacity = (value) => {
                for (const window_actor of global.get_window_actors()) {
                    if (window_actor === this.active_window_actor || this.is_ignored(window_actor)) {
                        continue;
                    }
                    GnomeFocusManager.set_opacity(window_actor, value);
                }
            };
            this.update_is_background_blur = (blur) => {
                const sigma = this.settings.blur_sigma;
                for (const window_actor of global.get_window_actors()) {
                    if (this.is_ignored(window_actor)) {
                        continue;
                    }
                    GnomeFocusManager.set_blur(window_actor, blur, sigma);
                }
            };
            this.update_blur_sigma = (sigma) => {
                for (const window_actor of global.get_window_actors()) {
                    if (this.is_ignored(window_actor)) {
                        continue;
                    }
                    GnomeFocusManager.set_blur(window_actor, this.settings.is_background_blur, sigma);
                }
            };
            settings.on('focus-opacity', this.update_focused_window_opacity);
            settings.on('special-opacity', this.update_special_focused_window_opacity);
            settings.on('inactive-opacity', this.update_inactive_windows_opacity);
            settings.on('blur-sigma', this.update_blur_sigma);
            settings.on('is-background-blur', this.update_is_background_blur);
        }
        static set_opacity(window_actor, percentage) {
            if (window_actor.is_destroyed()) {
                return;
            }
            const true_opacity = (DEFAULT_OPACITY * percentage) / 100;
            for (const actor of window_actor.get_children()) {
                actor.set_opacity(true_opacity);
            }
            window_actor.set_opacity(true_opacity);
        }
        static set_blur(window_actor, blur, sigma) {
            if (window_actor.is_destroyed() || !is_valid_window_type(window_actor.get_meta_window())) {
                return;
            }
            const blur_effect = window_actor.get_effect(BLUR_EFFECT_NAME);
            if (blur && !blur_effect) {
                const blur_effect = Shell.BlurEffect.new();
                blur_effect.set_mode(Shell.BlurMode.BACKGROUND);
                blur_effect.set_sigma(sigma);
                blur_effect.set_enabled(blur);
                window_actor.add_effect_with_name(BLUR_EFFECT_NAME, blur_effect);
            }
            if (blur_effect) {
                blur_effect.set_sigma(sigma);
                blur_effect.set_enabled(blur);
            }
            if (!blur) {
                window_actor.remove_effect_by_name(BLUR_EFFECT_NAME);
            }
        }
        disable() {
            this.settings.clear();
            for (const window_actor of global.get_window_actors()) {
                GnomeFocusManager.set_opacity(window_actor, 100);
                GnomeFocusManager.set_blur(window_actor, false, 0);
            }
        }
    }

    const ExtensionUtils$1 = imports.misc.extensionUtils;
    const Me$1 = ExtensionUtils$1.getCurrentExtension();
    const Gio = imports.gi.Gio;
    class FocusSettings {
        constructor(settings) {
            this.listeners = {
                'focus-opacity': [],
                'inactive-opacity': [],
                'special-opacity': [],
                'blur-sigma': [],
                'is-background-blur': [],
            };
            this.settings = settings;
        }
        get focus_opacity() {
            return this.settings.get_uint('focus-opacity');
        }
        set_focus_opacity(val) {
            this.settings.set_uint('focus-opacity', val);
        }
        get special_focus_opacity() {
            return this.settings.get_uint('special-focus-opacity');
        }
        set_special_focus_opacity(val) {
            this.settings.set_uint('special-focus-opacity', val);
        }
        get inactive_opacity() {
            return this.settings.get_uint('inactive-opacity');
        }
        set_inactive_opacity(val) {
            this.settings.set_uint('inactive-opacity', val);
        }
        get blur_sigma() {
            return this.settings.get_uint('blur-sigma');
        }
        set_blur_sigma(val) {
            this.settings.set_uint('blur-sigma', val);
        }
        get is_background_blur() {
            return this.settings.get_boolean('is-background-blur');
        }
        set_is_background_blur(val) {
            this.settings.set_boolean('is-background-blur', val);
        }
        on(event, callback) {
            if (this.connection === undefined) {
                this.connection = this.settings.connect('changed', (_, key) => {
                    switch (key) {
                        case 'focus-opacity':
                        case 'inactive-opacity':
                        case 'special-opacity':
                        case 'blur-sigma':
                            this.emit(key, this.settings.get_uint(key));
                            break;
                        case 'is-background-blur':
                            this.emit(key, this.settings.get_boolean(key));
                            break;
                    }
                });
            }
            this.listeners[event].push(callback);
        }
        off(event, callback) {
            const index = this.listeners[event].indexOf(callback);
            if (index >= 0) {
                this.listeners[event].slice(index, 1);
            }
            for (const key in this.listeners) {
                if (this.listeners[key].length > 0) {
                    return;
                }
            }
            this.clear();
        }
        emit(event, value) {
            for (const listener of this.listeners[event]) {
                listener(value);
            }
        }
        clear() {
            if (this.connection !== undefined) {
                this.settings.disconnect(this.connection);
                delete this.connection;
            }
            for (const key in this.listeners) {
                if (this.listeners[key].length > 0) {
                    return;
                }
            }
        }
    }
    function get_settings() {
        var _a;
        const schema = Gio.SettingsSchemaSource.new_from_directory(Me$1.dir.get_child('schemas').get_path(), Gio.SettingsSchemaSource.get_default(), false);
        return new FocusSettings(new Gio.Settings({
            settings_schema: (_a = schema.lookup('org.gnome.shell.extensions.focus', true)) !== null && _a !== void 0 ? _a : undefined,
        }));
    }

    const GLib = imports.gi.GLib;
    class Timeouts {
        constructor() {
            this.add = (callback, interval = 0, priority = GLib.PRIORITY_DEFAULT) => {
                let timeout_id = undefined;
                this.active.add((timeout_id = GLib.timeout_add(priority, interval, () => {
                    const result = callback();
                    if (!result && timeout_id) {
                        this.active.delete(timeout_id);
                    }
                    return result;
                })));
            };
            this.clear = () => {
                this.active.forEach(id => {
                    GLib.Source.remove(id);
                });
                this.active.clear();
            };
            this.active = new Set();
        }
    }

    const ExtensionUtils = imports.misc.extensionUtils;
    const Me = ExtensionUtils.getCurrentExtension();
    let create_signal;
    let extension_instance;
    let timeout_manager;
    function get_window_actor(window) {
        for (const actor of global.get_window_actors()) {
            if (!actor.is_destroyed() && actor.get_meta_window() === window) {
                return actor;
            }
        }
        return undefined;
    }
    function focus_changed(window) {
        const actor = get_window_actor(window);
        if (actor) {
            extension_instance === null || extension_instance === void 0 ? void 0 : extension_instance.set_active_window_actor(actor);
        }
    }
    function enable() {
        log(`enabling ${Me.metadata.name} version ${Me.metadata.version}`);
        extension_instance = new GnomeFocusManager(get_settings(), load_config('special_focus.json'), load_config('ignore_focus.json'));
        create_signal = global.display.connect('window-created', function (_, win) {
            if (!is_valid_window_type(win)) {
                return;
            }
            win._focus_extension_signal = win.connect('focus', focus_changed);
            timeout_manager !== null && timeout_manager !== void 0 ? timeout_manager : (timeout_manager = new Timeouts());
            timeout_manager.add(() => {
                if (!win) {
                    return false;
                }
                if (undefined === extension_instance) {
                    return false;
                }
                try {
                    const actor = get_window_actor(win);
                    if (undefined === actor || actor.is_destroyed()) {
                        return false;
                    }
                    if (win.has_focus()) {
                        extension_instance.set_active_window_actor(actor);
                    }
                    else {
                        extension_instance.update_inactive_window_actor(actor);
                    }
                }
                catch (err) {
                    log(`Error on new window: ${err}`);
                }
                return false;
            }, 350);
        });
        for (const actor of global.get_window_actors()) {
            if (actor.is_destroyed()) {
                continue;
            }
            const win = actor.get_meta_window();
            if (!is_valid_window_type(win)) {
                continue;
            }
            if (undefined === win._focus_extension_signal) {
                win._focus_extension_signal = win.connect('focus', focus_changed);
            }
            if (win.has_focus()) {
                extension_instance.set_active_window_actor(actor);
            }
            else {
                extension_instance.update_inactive_window_actor(actor);
            }
        }
    }
    function disable() {
        log(`disabling ${Me.metadata.name} version ${Me.metadata.version}`);
        if (undefined !== create_signal) {
            global.display.disconnect(create_signal);
            create_signal = undefined;
        }
        timeout_manager === null || timeout_manager === void 0 ? void 0 : timeout_manager.clear();
        timeout_manager = undefined;
        for (const actor of global.get_window_actors()) {
            if (actor.is_destroyed()) {
                continue;
            }
            const win = actor.get_meta_window();
            if (win._focus_extension_signal) {
                win.disconnect(win._focus_extension_signal);
                delete win._focus_extension_signal;
            }
        }
        if (undefined !== extension_instance) {
            extension_instance.disable();
            extension_instance = undefined;
        }
    }
    function extension () {
        return {
            enable,
            disable,
        };
    }

    return extension;

})();
