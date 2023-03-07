var prefs = (function () {
    'use strict';

    const ExtensionUtils$1 = imports.misc.extensionUtils;
    const Me$1 = ExtensionUtils$1.getCurrentExtension();
    const Gio$1 = imports.gi.Gio;
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
        const schema = Gio$1.SettingsSchemaSource.new_from_directory(Me$1.dir.get_child('schemas').get_path(), Gio$1.SettingsSchemaSource.get_default(), false);
        return new FocusSettings(new Gio$1.Settings({
            settings_schema: (_a = schema.lookup('org.gnome.shell.extensions.focus', true)) !== null && _a !== void 0 ? _a : undefined,
        }));
    }

    const ExtensionUtils = imports.misc.extensionUtils;
    const Me = ExtensionUtils.getCurrentExtension();
    const Gio = imports.gi.Gio;
    const Gtk = imports.gi.Gtk;
    const { Orientation } = Gtk;
    function init() { }
    function buildPrefsWidget() {
        const settings = get_settings();
        const widget = new Gtk.Grid({
            column_spacing: 12,
            row_spacing: 12,
            visible: true,
        });
        const title = new Gtk.Label({
            label: '<b>' + Me.metadata.name + ' Extension Preferences</b>',
            halign: Gtk.Align.START,
            use_markup: true,
            visible: true,
        });
        widget.attach(title, 0, 0, 1, 1);
        const create_scale = (label, get_current_value, set_value) => {
            const item_label = new Gtk.Label({
                label,
                halign: Gtk.Align.START,
                visible: true,
            });
            const item_scale = Gtk.Scale.new_with_range(Orientation.HORIZONTAL, 50, 100, 5);
            item_scale.set_visible(true);
            item_scale.set_value(get_current_value());
            item_scale.connect('change-value', () => {
                const value = item_scale.get_value();
                if (value <= 100 && value >= 50) {
                    set_value(value);
                    Gio.Settings.sync();
                }
            });
            return [item_label, item_scale];
        };
        const [focus_opacity_label, focus_opacity_scale] = create_scale('Focus Opacity', () => settings.focus_opacity, value => settings.set_focus_opacity(value));
        widget.attach(focus_opacity_label, 0, 1, 1, 1);
        widget.attach(focus_opacity_scale, 0, 2, 2, 1);
        const [inactive_opacity_label, inactive_opacity_scale] = create_scale('Inactive Opacity', () => settings.inactive_opacity, value => settings.set_inactive_opacity(value));
        widget.attach(inactive_opacity_label, 0, 3, 1, 1);
        widget.attach(inactive_opacity_scale, 0, 4, 2, 1);
        const [special_focus_opacity_label, special_focus_opacity_scale] = create_scale('Special Focus Opacity', () => settings.special_focus_opacity, value => settings.set_special_focus_opacity(value));
        widget.attach(special_focus_opacity_label, 0, 5, 1, 1);
        widget.attach(special_focus_opacity_scale, 0, 6, 2, 1);
        const blur_label = new Gtk.Label({
            label: 'Blur Background [Experimental]',
            halign: Gtk.Align.START,
            visible: true,
        });
        const blur_toggle = new Gtk.Switch({
            visible: true,
            active: settings.is_background_blur,
        });
        blur_toggle.connect('notify::active', () => {
            settings.set_is_background_blur(blur_toggle.get_active());
            Gio.Settings.sync();
        });
        widget.attach(blur_label, 0, 7, 1, 1);
        widget.attach(blur_toggle, 1, 7, 1, 1);
        const blur_sigma_label = new Gtk.Label({
            label: 'Blur Sigma',
            halign: Gtk.Align.START,
            visible: true,
        });
        const blur_sigma_entry = new Gtk.Entry({
            input_purpose: Gtk.InputPurpose.NUMBER,
            visible: true,
        });
        blur_sigma_entry.set_text(settings.blur_sigma.toString());
        blur_sigma_entry.connect('changed', function () {
            const value = parseInt(blur_sigma_entry.text);
            if (!isNaN(value) && value >= 0) {
                settings.set_blur_sigma(value);
                Gio.Settings.sync();
            }
        });
        widget.attach(blur_sigma_label, 0, 8, 1, 1);
        widget.attach(blur_sigma_entry, 1, 8, 1, 1);
        return widget;
    }
    var prefs = {
        init,
        buildPrefsWidget,
    };

    return prefs;

})();
var init = prefs.init;
var buildPrefsWidget = prefs.buildPrefsWidget;
