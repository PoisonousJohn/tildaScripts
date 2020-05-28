
window.loadScript = function (scriptObj) {
    var script = document.createElement('script');
    script.src = scriptObj.src;
    if (scriptObj.integrity) script.integrity = scriptObj.integrity;
    if (scriptObj.crossorigin) script.crossOrigin = scriptObj.crossOrigin;
    document.head.appendChild(script);
};

window.deliveryValidation = {
    datePickerObserver: null,
    config: {
        timeInputName: "Время доставки ТОЛЬКО С 12:00",
        dateInputName: "Дата доставки ",
        orderStartTime: "12:00",
        orderEndTime: "22:30",
        orderStartEndTimeError: "Мы принимаем заказы с 12:00 до 22:30",
        minOrderPreparationTimeMinutes: 90,
        minTimeError: "Для приготовления заказа нужно минимум 90 минут.",
    },

    observeChanges: function (element, callback) {
        var observer = new MutationObserver(callback);
        observer.observe(element, { childList: true, subtree: true });
        return observer;
    },

    parseTime: function (date, timeString) {
        if (!date || !timeString) return null;

        var timeComponents = timeString.split(':');
        var hours = parseInt(timeComponents[0]);
        var minutes = parseInt(timeComponents[1]);
        if (hours < 0 || hours > 23) return null;
        if (minutes < 0 || minutes > 59) return null;
        date.setHours(timeComponents[0]);
        date.setMinutes(timeComponents[1]);

        return date;
    },

    parseDate: function (dateString) {
        if (!dateString || dateString.includes('_')) return new Date();
        var momentDate = moment(dateString, 'DD-MM-YYYY');
        if (!momentDate.isValid()) return null;
        return momentDate.toDate();
    },

    parseDateTime: function (dateString, timeString) {
        if (!dateString) dateString = moment().format('DD-MM-YYYY');
        if (!timeString) return null;
        if (dateString.includes('_') || timeString.includes('_')) return null;
        return moment(dateString + ' ' + timeString, 'DD-MM-YYYY HH:mm').toDate();
    },

    validateTimeFormat: function () {
        var timeInput = this.getTimeInput();
        var val = timeInput.val();
        if (!val || val.includes('_')) return null;
        var error = !this.parseTime(new Date(), timeInput.val()) ? 'Некорректный формат времени' : null;
        this.showInputError(timeInput, error);
        return error;
    },

    validateDateFormat: function () {
        var dateInput = this.getDateInput();
        var error = !this.parseDate(dateInput.val()) ? 'Некорректный формат даты, пожалуйста введите дату в формате ДД-ММ-ГГГГ' : null;
        this.showInputError(dateInput, error);
        return error;
    },

    validateTimeRange: function () {
        var currentTime = new Date();
        var parsedTime = this.parseDateTime(this.getDateInput().val(), this.getTimeInput().val());
        if (!parsedTime) return null;
        var startTime = moment(this.config.orderStartTime, 'HH:mm');
        var endTime = moment(this.config.orderEndTime, 'HH:mm');
        var parsedTimeOnly = moment(moment(parsedTime).format('HH:mm'), 'HH:mm');
        if (!parsedTimeOnly.isBetween(startTime, endTime) && !(parsedTimeOnly.isSame(startTime) || parsedTimeOnly.isSame(endTime)))
            return this.config.orderStartEndTimeError;
        var minTime = new Date(currentTime.getTime() + this.config.minOrderPreparationTimeMinutes * 60 * 1000);
        if (parsedTime.getTime() < minTime.getTime()) return this.config.minTimeError;
    },

    validateForm: function () {
        var dateError = window.deliveryValidation.validateDateFormat();
        var timeError = window.deliveryValidation.validateTimeFormat();
        var rangeError = window.deliveryValidation.validateTimeRange();
        var error = dateError || timeError || rangeError;
        this.showInputError(this.getTimeInput(), timeError || rangeError);
        return error;
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
            if (window.deliveryValidation.validateForm()) {
                event.stopPropagation();
                window.deliveryValidation.getTimeInput().focus();
                return false;
            }
        });
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