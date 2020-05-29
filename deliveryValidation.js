
window.loadScript = function (scriptObj) {
    var script = document.createElement('script');
    script.src = scriptObj.src;
    if (scriptObj.integrity) script.integrity = scriptObj.integrity;
    if (scriptObj.crossorigin) script.crossOrigin = scriptObj.crossOrigin;
    document.head.appendChild(script);
};

window.deliveryValidation = {
    config: {
        timeDeliveryToggleName: "Хотите получить заказ как можно скорее или к определенному времени",
        timeDeliveryVisibleValue: "К определенному времени",
        timeInputName: "Время доставки ТОЛЬКО С 12:00",
        dateInputName: "Дата доставки ",
        orderStartTime: "12:00",
        orderEndTime: "22:30",
        orderStartEndTimeError: "Мы принимаем заказы с 12:00 до 22:30",
        minOrderPreparationTimeMinutes: 90,
        minTimeError: "Для приготовления заказа нужно минимум 90 минут.",
        incorrectDateError: "Пожалуйста введите дату в формате ДД-ММ-ГГГГ",
        incorrectTimeError: "Пожалуйста введите время в формате ЧЧ:ММ",
    },
    errors: {
        time: null,
        date: null
    },

    observeChanges: function (element, callback) {
        var observer = new MutationObserver(callback);
        observer.observe(element, { childList: true, subtree: true });
        return observer;
    },

    isTimeValid: function () {
        var val = this.getTimeInput().val();
        if (!val || val.includes('_')) return true;
        return moment(val, 'HH:mm').isValid();
    },

    isDateValid: function () {
        var val = this.getDateInput().val();
        if (!val || val.includes('_')) return true;
        return moment(val, 'DD-MM-YYYY').isValid();
    },

    showErrors: function () {
        this.showInputError(this.getTimeInput(), this.errors.time);
        this.showInputError(this.getDateInput(), this.errors.date);
    },

    validateFormat: function () {
        this.errors.date = !this.isDateValid() ? this.config.incorrectDateError : null;
        this.errors.time = !this.isTimeValid() ? this.config.incorrectTimeError : null;
    },

    isDateEmpty: function () {
        var val = this.getDateInput().val();
        return !val || val.includes('_');
    },

    isTimeEmpty: function () {
        var val = this.getTimeInput().val();
        return !val || val.includes('_');
    },

    hasErrors: function () {
        return this.errors.date || this.errors.time;
    },

    validateTimeRange: function () {
        this.validateFormat();
        if (!this.isTimeEmpty() && !this.isDateEmpty()) {
            var currentTime = moment();
            var parsedTime = moment(this.getDateInput().val() + ' ' + this.getTimeInput().val(), 'DD-MM-YYYY HH:mm');
            if (!parsedTime.isValid()) return null;
            var startTime = moment(this.config.orderStartTime, 'HH:mm');
            var endTime = moment(this.config.orderEndTime, 'HH:mm');
            var parsedTimeOnly = moment(parsedTime.format('HH:mm'), 'HH:mm');
            var isInRange = parsedTimeOnly.isBetween(startTime, endTime) || parsedTimeOnly.isSame(startTime) || parsedTimeOnly.isSame(endTime);
            var minTime = currentTime.add(this.config.minOrderPreparationTimeMinutes, 'minutes');
            console.log(JSON.stringify({
                parsedTime, startTime, endTime, parsedTimeOnly, minTime
            }));
            var isPreparationTimeSatisfied = parsedTime.isAfter(minTime);
            this.errors.time = !isInRange ? this.config.orderStartEndTimeError : null;
            if (!this.errors.time) {
                this.errors.time = !isPreparationTimeSatisfied ? this.config.minTimeError : null;
            }
        }
        this.showErrors();
    },

    clearErrors: function () {
        this.errors.time = null;
        this.errors.date = null;
    },

    validateRequiredFields: function () {
        if (this.isTimeEmpty())
            this.errors.time = 'Обязательное поле';
        if (this.isDateEmpty())
            this.errors.date = 'Обязательное поле';
        this.showErrors();
    },

    validateForm: function () {
        this.clearErrors();
        this.showErrors();
        if (this.isTimeValidationRequired())
            this.validateTimeRange();
        return this.hasErrors();
    },

    isTimeValidationRequired: function () {
        return this.getVisibilityToggle().filter(':checked').val() == this.config.timeDeliveryVisibleValue;
    },

    updateFieldsVisibility: function () {
        var visible = this.isTimeValidationRequired();
        if (visible) {
            this.getTimeInput().parents('.t-input-group').show();
            this.getDateInput().parents('.t-input-group').show();
        }
        else {
            this.getTimeInput().parents('.t-input-group').hide();
            this.getDateInput().parents('.t-input-group').hide();
        }
    },

    onChangeDistinct: function (el, callback) {
        el.keyup(function (event) {
            var input = jQuery(this);
            var val = input.val();

            if (input.data("lastval") != val) {
                input.data("lastval", val);
                callback(el, val);
            }
        });
    },
    showInputError: function (el, error) {
        var errorControl = jQuery(el).parents('.t-input-group');
        if (error)
            errorControl.addClass('js-error-control-box');
        else
            errorControl.removeClass('js-error-control-box');
        el.next().text(error);
    },

    getVisibilityToggle: function () {
        return jQuery('[name="' + this.config.timeDeliveryToggleName + '"]');
    },

    getTimeInput: function () {
        return jQuery('input[name="' + this.config.timeInputName + '"]');
    },

    getDateInput: function () {
        return jQuery('input[name="' + this.config.dateInputName + '"]');
    },

    onReady: function () {
        var timeInput = this.getTimeInput();
        this.onChangeDistinct(timeInput, function () {
            window.deliveryValidation.validateForm();
        });
        var dateInput = this.getDateInput();
        dateInput.blur(function () {
            setTimeout(function () {
                window.deliveryValidation.validateForm();
            }, 100);

        });
        this.onChangeDistinct(dateInput, function () {
            window.deliveryValidation.validateForm();
        });

        jQuery('.t-submit').click(function (event) {
            window.deliveryValidation.validateForm();
            window.deliveryValidation.validateRequiredFields();
            if (window.deliveryValidation.hasErrors()) {
                event.stopPropagation();
                window.deliveryValidation.getTimeInput().focus();
                return false;
            }
        });
        this.getVisibilityToggle().each(function () {
            jQuery(this).on('change', function () { window.deliveryValidation.updateFieldsVisibility(); });
        });
        this.updateFieldsVisibility();
        this.validateForm();
        this.getDateInput().attr('data-mindate', moment().format('YYYY-MM-DD'));
    },


    setupDeliveryValidation: function (config) {
        if (config) this.config = config;
        jQuery(document).on('ready', function () {
            onReady();
        });
    }
};

[
    {
        src: "https://cdn.jsdelivr.net/npm/moment@2.26.0/moment.min.js"
    }
].forEach(function (item) {
    window.loadScript(item);
});

setTimeout(function () {
    window.deliveryValidation.onReady();
    window.deliveryValidation.setupDeliveryValidation();
}, 1000);