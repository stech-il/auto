<?php
/**
 * Plugin Name: WP AI Site Builder
 * Plugin URI: https://your-domain.com
 * Description: בונה אתרי וורדפרס בלחיצת כפתור באמצעות AI - הזן פרומפט וקבל אתר מלא
 * Version: 1.0.0
 * Author: Your Name
 * Text Domain: wp-ai-site-builder
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

define('WPAI_BUILDER_VERSION', '1.0.0');
define('WPAI_BUILDER_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('WPAI_BUILDER_PLUGIN_URL', plugin_dir_url(__FILE__));

class WP_AI_Site_Builder {

    private $api_url = '';
    private $license_key = '';

    public function __construct() {
        add_action('admin_menu', [$this, 'add_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
        add_action('wp_ajax_wpai_build_site', [$this, 'ajax_build_site']);
        add_action('wp_ajax_wpai_validate_license', [$this, 'ajax_validate_license']);
    }

    public function add_menu() {
        add_menu_page(
            'WP AI Site Builder',
            'AI Site Builder',
            'manage_options',
            'wpai-site-builder',
            [$this, 'render_admin_page'],
            'dashicons-admin-customizer',
            30
        );
    }

    public function register_settings() {
        register_setting('wpai_builder_settings', 'wpai_api_url', [
            'sanitize_callback' => 'esc_url_raw',
        ]);
        register_setting('wpai_builder_settings', 'wpai_license_key', [
            'sanitize_callback' => 'sanitize_text_field',
        ]);
    }

    public function enqueue_assets($hook) {
        if (strpos($hook, 'wpai-site-builder') === false) {
            return;
        }

        wp_enqueue_style(
            'wpai-builder-admin',
            WPAI_BUILDER_PLUGIN_URL . 'assets/css/admin.css',
            [],
            WPAI_BUILDER_VERSION
        );
        wp_enqueue_script(
            'wpai-builder-admin',
            WPAI_BUILDER_PLUGIN_URL . 'assets/js/admin.js',
            ['jquery'],
            WPAI_BUILDER_VERSION,
            true
        );
        wp_localize_script('wpai-builder-admin', 'wpaiBuilder', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('wpai_builder_nonce'),
        ]);
    }

    public function render_admin_page() {
        $api_url = get_option('wpai_api_url', '');
        $license_key = get_option('wpai_license_key', '');
        ?>
        <div class="wrap wpai-builder-wrap">
            <h1>🏗️ WP AI Site Builder</h1>
            <p class="wpai-desc">בנה אתר מלא בלחיצת כפתור לפי הפרומפט שלך</p>

            <div class="wpai-settings-card">
                <h2>הגדרות</h2>
                <form method="post" action="options.php" class="wpai-settings-form">
                    <?php settings_fields('wpai_builder_settings'); ?>
                    <table class="form-table">
                        <tr>
                            <th><label for="wpai_api_url">API URL</label></th>
                            <td>
                                <input type="url" id="wpai_api_url" name="wpai_api_url"
                                       value="<?php echo esc_attr($api_url); ?>"
                                       class="regular-text" placeholder="https://your-api.onrender.com"/>
                                <p class="description">כתובת ה-API שרץ על Render</p>
                            </td>
                        </tr>
                        <tr>
                            <th><label for="wpai_license_key">קוד רישיון</label></th>
                            <td>
                                <input type="text" id="wpai_license_key" name="wpai_license_key"
                                       value="<?php echo esc_attr($license_key); ?>"
                                       class="regular-text" placeholder="הכנס את קוד הרישיון"/>
                                <button type="button" class="button wpai-validate-btn">בדוק רישיון</button>
                                <span class="wpai-license-status"></span>
                            </td>
                        </tr>
                    </table>
                    <?php submit_button('שמור הגדרות'); ?>
                </form>
            </div>

            <div class="wpai-build-card">
                <h2>בנה אתר חדש</h2>
                <div class="wpai-prompt-box">
                    <label for="wpai_prompt">פרומפט (תאר את האתר שברצונך ליצור):</label>
                    <textarea id="wpai_prompt" rows="4" placeholder="לדוגמה: אתר לחנות פרחים, עיצוב מינימליסטי ומודרני, 5 דפים - בית, אודות, מוצרים, גלריה, צור קשר"></textarea>
                    <button type="button" class="button button-primary button-hero wpai-build-btn" disabled>
                        🚀 בנה אתר בלחיצת כפתור
                    </button>
                </div>
                <div class="wpai-progress" style="display:none;">
                    <div class="wpai-spinner"></div>
                    <p class="wpai-status">מעבירים ל-AI...</p>
                </div>
                <div class="wpai-result" style="display:none;"></div>
                <div class="wpai-error" style="display:none;"></div>
            </div>
        </div>
        <?php
    }

    public function ajax_validate_license() {
        check_ajax_referer('wpai_builder_nonce', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'לא מורשה']);
        }

        $api_url = get_option('wpai_api_url');
        $license_key = get_option('wpai_license_key');

        if (empty($api_url) || empty($license_key)) {
            wp_send_json_error(['message' => 'חסרים API URL או קוד רישיון']);
        }

        $response = wp_remote_post(rtrim($api_url, '/') . '/api/license/validate', [
            'body' => json_encode([
                'license_key' => $license_key,
                'site_url' => home_url(),
            ]),
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 15,
        ]);

        if (is_wp_error($response)) {
            wp_send_json_error(['message' => $response->get_error_message()]);
        }

        $code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($code === 200 && !empty($body['valid'])) {
            wp_send_json_success(['message' => 'רישיון תקין ✓']);
        } else {
            wp_send_json_error(['message' => $body['error'] ?? 'רישיון לא תקין']);
        }
    }

    public function ajax_build_site() {
        check_ajax_referer('wpai_builder_nonce', 'nonce');
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => 'לא מורשה']);
        }

        $prompt = isset($_POST['prompt']) ? sanitize_textarea_field($_POST['prompt']) : '';
        if (empty($prompt)) {
            wp_send_json_error(['message' => 'יש להזין פרומפט']);
        }

        $api_url = get_option('wpai_api_url');
        $license_key = get_option('wpai_license_key');

        if (empty($api_url) || empty($license_key)) {
            wp_send_json_error(['message' => 'חסרים הגדרות API או רישיון']);
        }

        $response = wp_remote_post(rtrim($api_url, '/') . '/api/build', [
            'body' => json_encode([
                'license_key' => $license_key,
                'prompt' => $prompt,
                'site_url' => home_url(),
            ]),
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 90,
        ]);

        if (is_wp_error($response)) {
            wp_send_json_error(['message' => $response->get_error_message()]);
        }

        $code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($code !== 200 || empty($body['success'])) {
            wp_send_json_error(['message' => $body['error'] ?? 'שגיאה בבניית האתר']);
        }

        $data = $body['data'];
        $result = $this->apply_site_structure($data);

        wp_send_json_success($result);
    }

    private function apply_site_structure($data) {
        $created = [];
        $errors = [];

        // Switch theme if needed
        if (!empty($data['theme']) && wp_get_theme($data['theme'])->exists()) {
            switch_theme($data['theme']);
            $created[] = "תימה: {$data['theme']}";
        } elseif (!empty($data['theme'])) {
            $created[] = "תימה {$data['theme']} אינה מותקנת - השארנו את התימה הנוכחית";
        }

        // Create pages
        if (!empty($data['pages']) && is_array($data['pages'])) {
            usort($data['pages'], function ($a, $b) {
                return ($a['menu_order'] ?? 0) - ($b['menu_order'] ?? 0);
            });

            foreach ($data['pages'] as $page) {
                $slug = sanitize_title($page['slug'] ?? $page['title'] ?? 'page');
                $title = sanitize_text_field($page['title'] ?? 'דף חדש');
                $content = wp_kses_post($page['content'] ?? '');
                $order = absint($page['menu_order'] ?? 0);

                $existing = get_page_by_path($slug);
                if ($existing) {
                    $created[] = "דף '{$title}' כבר קיים";
                    continue;
                }

                $page_id = wp_insert_post([
                    'post_title' => $title,
                    'post_name' => $slug,
                    'post_content' => $content,
                    'post_status' => 'publish',
                    'post_type' => 'page',
                    'menu_order' => $order,
                    'post_author' => get_current_user_id(),
                ]);

                if (is_wp_error($page_id)) {
                    $errors[] = "שגיאה ביצירת '{$title}': " . $page_id->get_error_message();
                } else {
                    $created[] = "נוצר דף: {$title}";
                }
            }
        }

        // Set design (Customizer) if available
        if (!empty($data['design'])) {
            $this->apply_design($data['design']);
            $created[] = 'העיצוב הותאם';
        }

        // Create menu
        if (!empty($data['menu']) && !empty($data['pages'])) {
            $this->create_menu($data);
            $created[] = 'תפריט נוצר';
        }

        return [
            'created' => $created,
            'errors' => $errors,
            'message' => count($errors) === 0
                ? 'האתר נבנה בהצלחה!'
                : 'האתר נבנה עם כמה אזהרות.',
        ];
    }

    private function apply_design($design) {
        $options = [
            'primary_color' => '--wp--preset--color--primary',
            'secondary_color' => '--wp--preset--color--secondary',
        ];
        foreach ($options as $key => $opt) {
            if (!empty($design[$key])) {
                set_theme_mod($key, sanitize_hex_color($design[$key]));
            }
        }
        if (!empty($design['style'])) {
            set_theme_mod('design_style', sanitize_text_field($design['style']));
        }
    }

    private function create_menu($data) {
        $menu_name = $data['menu']['name'] ?? 'Primary Menu';
        $menu_exists = wp_get_nav_menu_object($menu_name);
        if ($menu_exists) {
            return $menu_exists->term_id;
        }

        $menu_id = wp_create_nav_menu($menu_name);
        if (is_wp_error($menu_id)) {
            return false;
        }

        $pages = $data['pages'] ?? [];
        $position = 0;
        foreach ($pages as $page) {
            $slug = sanitize_title($page['slug'] ?? $page['title'] ?? '');
            $p = get_page_by_path($slug);
            if ($p) {
                wp_update_nav_menu_item($menu_id, 0, [
                    'menu-item-title' => $page['title'] ?? $p->post_title,
                    'menu-item-object' => 'page',
                    'menu-item-object-id' => $p->ID,
                    'menu-item-type' => 'post_type',
                    'menu-item-status' => 'publish',
                    'menu-item-position' => $position++,
                ]);
            }
        }

        $locations = get_theme_mod('nav_menu_locations', []);
        $locations['primary'] = $menu_id;
        set_theme_mod('nav_menu_locations', $locations);
        return $menu_id;
    }
}

new WP_AI_Site_Builder();
