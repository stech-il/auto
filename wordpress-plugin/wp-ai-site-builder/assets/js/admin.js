(function ($) {
    'use strict';

    function canBuild() {
        const apiUrl = $('#wpai_api_url').val().trim();
        const licenseKey = $('#wpai_license_key').val().trim();
        return apiUrl.length > 0 && licenseKey.length >= 10;
    }

    function updateBuildButton() {
        $('.wpai-build-btn').prop('disabled', !canBuild());
    }

    $('#wpai_api_url, #wpai_license_key').on('input', updateBuildButton);
    updateBuildButton();

    $('.wpai-validate-btn').on('click', function () {
        const $btn = $(this);
        const $status = $('.wpai-license-status');
        $btn.prop('disabled', true);
        $status.removeClass('valid invalid').text('בודק...');

        $.post(wpaiBuilder.ajaxUrl, {
            action: 'wpai_validate_license',
            nonce: wpaiBuilder.nonce,
        })
            .done(function (r) {
                if (r.success) {
                    $status.addClass('valid').text(r.data.message);
                } else {
                    $status.addClass('invalid').text(r.data?.message || 'שגיאה');
                }
            })
            .fail(function () {
                $status.addClass('invalid').text('שגיאת תקשורת');
            })
            .always(function () {
                $btn.prop('disabled', false);
            });
    });

    $('.wpai-build-btn').on('click', function () {
        const $btn = $(this);
        const prompt = $('#wpai_prompt').val().trim();
        const $progress = $('.wpai-progress');
        const $result = $('.wpai-result');
        const $error = $('.wpai-error');

        if (!prompt) {
            alert('הזן פרומפט לבניית האתר');
            return;
        }

        if (!canBuild()) {
            alert('הגדר API URL וקוד רישיון לפני בניית האתר');
            return;
        }

        $progress.show();
        $result.hide();
        $error.hide();
        $btn.prop('disabled', true);

        $('.wpai-status').text('שולח ל-AI...');

        $.post(wpaiBuilder.ajaxUrl, {
            action: 'wpai_build_site',
            nonce: wpaiBuilder.nonce,
            prompt: prompt,
        })
            .done(function (r) {
                if (r.success) {
                    $('.wpai-status').text('מיישם על האתר...');
                    const data = r.data || {};
                    let html = '<strong>' + (data.message || 'האתר נבנה בהצלחה!') + '</strong>';
                    if (data.created && data.created.length) {
                        html += '<ul>';
                        data.created.forEach(function (item) {
                            html += '<li>' + item + '</li>';
                        });
                        html += '</ul>';
                    }
                    if (data.errors && data.errors.length) {
                        html += '<p style="color:#856404;">אזהרות:</p><ul>';
                        data.errors.forEach(function (item) {
                            html += '<li>' + item + '</li>';
                        });
                        html += '</ul>';
                    }
                    $result.html(html).show();
                    $('#wpai_prompt').val('');
                } else {
                    $error.text(r.data?.message || 'שגיאה לא ידועה').show();
                }
            })
            .fail(function (xhr) {
                const msg = xhr.responseJSON?.data?.message || xhr.statusText || 'שגיאת תקשורת';
                $error.text(msg).show();
            })
            .always(function () {
                $progress.hide();
                $btn.prop('disabled', false);
                updateBuildButton();
            });
    });
})(jQuery);
