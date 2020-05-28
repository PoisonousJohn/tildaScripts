
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
        minTimeBufferMinutes: 15,
        minTimeError: "Для приготовления заказа нужно минимум 15 минут.",
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
        var date = null;
        if (dateString && !dateString.includes('_')) {
            var momentDate = moment(dateString, 'DD-MM-YYYY');
            if (!momentDate.isValid()) return null;
            date = momentDate.toDate();
        }

        return date;
    },

    parseDateTime: function (dateString, timeString) {
        return this.parseTime(this.parseDate(dateString), timeString);
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
        var minTime = new Date(currentTime.getTime() + this.config.minTimeBufferMinutes * 60 * 1000);
        console.log('parsed time: ' + parsedTime + ', minTime: ' + minTime);
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
        console.log('on change distinct');
        el.keyup(function (event) {
            console.log('input event');
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
        console.log('Time input: ' + timeInput);
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
                alert('stop');
                event.stopPropagation();
                return false;
            }
        });
        this.validateForm();
        this.getDateInput().attr('data-mindate', moment().format('YYYY-MM-DD'));
        this.datePickerObserver = this.observeChanges(document.getElementById('form182822419'), function () {
            console.log('Changes observed!');
            var dateInput = window.deliveryValidation.getDateInput();
            if (dateInput.length) {
                console.log('Found date input!');
                dateInput.attr('data-mindate', moment().format('YYYY-MM-DD'));
                window.deliveryValidation.datePickerObserver.disconnect();
            }
        });

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