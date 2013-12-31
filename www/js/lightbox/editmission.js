define("lightbox/editmission",
       ["i18n", "laces", "lightbox", "lodash", "tmpl/editmission", "tmpl/scheduleoptions"],
       function(i18n, Laces, Lightbox, _, tmpl) {

    "use strict";

    function zeroPad(number) {
        return (number < 10 ? "0" : "") + number;
    }

    function formatTime(hour, minute) {
        return zeroPad(hour) + ":" + zeroPad(minute);
    }

    function parseInts(array) {
        return _.map(array, function(item) { return _.parseInt(item); });
    }

    function selectInts($el) {
        return parseInts(_.pluck($el.select2("data"), "id"));
    }

    return Lightbox.extend({

        initialize: function(options) {

            this.buttons = [
                { label: i18n("Cancel"), extraClass: "action-close", data: { dismiss: "modal" } },
                { label: i18n("Save"), extraClass: "action-save btn-primary" }
            ];

            var mission = this.createModel("mission");
            if (options.mission) {
                mission.set(options.mission.toJSON());

                this.title = i18n("Edit %1").arg(mission.name);

                this.buttons.unshift({
                    label: i18n("Remove"),
                    extraClass: "action-remove btn-danger pull-left"
                });
            } else {
                mission.name = i18n("Unnamed mission").toString();

                this.title = i18n("New Mission");
            }

            this.mission = mission;

            this.subscribe(mission, "change:actions", "renderContent");

            this._initScbeduleOptions();
        },

        events: {
            "click .action-add-action": "_addAction",
            "click .action-edit-action": "_editAction",
            "click .action-remove-action": "_removeAction",
            "click .action-remove": "_remove",
            "click .action-save": "_save",
            "click .action-toggle-advanced": "_toggleAdvanced",
            "click .action-toggle-schedule": "_toggleSchedule"
        },

        renderContent: function() {

            var tie = new Laces.Tie(this.mission, tmpl.editmission);
            this.$(".js-content").html(tie.render());

            var scheduleTie = new Laces.Tie(this.scheduleOptions, tmpl.scheduleoptions);
            this.$(".js-schedule").html(scheduleTie.render());

            this._renderScheduleOptions();
        },

        _addAction: function() {

            this.openLightbox("EditAction", { context: this }).then(function(action) {
                this.mission.actions.push(action);
            });
        },

        _editAction: function(event) {

            var index = this.targetData(event, "action-index");
            this.openLightbox("EditAction", { action: this.mission.actions[index] });
        },

        _initScbeduleOptions: function() {

            this.days = [
                i18n("Sunday"),
                i18n("Monday"),
                i18n("Tuesday"),
                i18n("Wednesday"),
                i18n("Thursday"),
                i18n("Friday"),
                i18n("Saturday")
            ];

            this.scheduleOptions = new Laces.Model({
                scheduleType: "manual",
                manualSchedule: function() { return this.scheduleType === "manual"; },
                hourlySchedule: function() { return this.scheduleType === "hourly"; },
                dailySchedule: function() { return this.scheduleType === "daily"; },
                weeklySchedule: function() { return this.scheduleType === "weekly"; },
                customSchedule: function() { return this.scheduleType === "custom"; },
                manualLabelClass: function() { return this.manualSchedule ? "" : "text-normal"; },
                hourlyLabelClass: function() { return this.hourlySchedule ? "" : "text-normal"; },
                dailyLabelClass: function() { return this.dailySchedule ? "" : "text-normal"; },
                weeklyLabelClass: function() { return this.weeklySchedule ? "" : "text-normal"; },
                customLabelClass: function() { return this.customSchedule ? "" : "text-normal"; },
                // hourly options
                minute: 0,
                exceptHours: true,
                exceptHourStart: "18:00",
                exceptHourEnd: "09:00",
                excludedDays: [0, 6], // also for dialy
                exceptDays: true, // also for daily
                // daily options
                time: "09:00", // also for weekly
                // weekly options
                day: 1,
                // custom options
                days: [1, 2, 3, 4, 5],
                hours: [9, 11, 13, 15, 17],
                minutes: [0]
            });

            this._restoreScheduleOptions();
        },


        _removeAction: function(event) {

            var index = this.targetData(event, "action-index");
            this.mission.actions.splice(index, 1);
        },

        _remove: function() {

            var $button = this.$(".action-remove");
            $button.addClass("btn-progress");

            this.application.confirm(i18n("Are you sure you want to remove this mission?"), {
                context: this,
                title: i18n("Remove mission")
            }).then(function() {
                this.mission.remove({ context: this }).then(function() {
                    this.resolve();
                }, function(error) {
                    this.showError(i18n("Could not remove the mission"), error);
                }).always(function() {
                    $button.removeClass("btn-progress");
                });
            });
        },

        _renderScheduleOptions: function() {

            var days = this.days;
            var daysOptionsHtml = _.map(days, function(day, index) {
                return '<option value="' + index + '">' + _.escape(day) + '</option>';
            });

            var $excludedDays = this.$(".js-excluded-days");
            $excludedDays.html(daysOptionsHtml);
            $excludedDays.select2();
            $excludedDays.select2("data", _.map(this.scheduleOptions.excludedDays, function(day) {
                return { id: day, text: days[day] };
            }));

            var $day = this.$(".js-weekly-day");
            $day.html(daysOptionsHtml);
            $day.select2();
            var day = this.scheduleOptions.day;
            $day.select2("data", { id: day, text: days[day] });

            var $days = this.$(".js-custom-days");
            $days.html(daysOptionsHtml);
            $days.select2();
            $days.select2("data", _.map(this.scheduleOptions.days, function(day) {
                return { id: day, text: days[day] };
            }));

            var hoursOptionsHtml = _.map(_.range(24), function(hour) {
                return '<option value="' + hour + '">' + hour + '</option>';
            }).join("");

            var $hours = this.$(".js-custom-hours");
            $hours.html(hoursOptionsHtml);
            $hours.select2();
            $hours.select2("data", _.map(this.scheduleOptions.hours, function(hour) {
                return { id: hour, text: hour };
            }));

            var minutesOptionsHtml = _.map(_.range(60), function(minute) {
                return '<option value="' + minute + '">' + zeroPad(minute) + '</option>';
            }).join("");

            var $minutes = this.$(".js-custom-minutes");
            $minutes.html(minutesOptionsHtml);
            $minutes.select2();
            $minutes.select2("data", _.map(this.scheduleOptions.minutes, function(minute) {
                return { id: minute, text: zeroPad(minute) };
            }));

            if (this.mission.schedule) {
                this._toggleSchedule();
            }
        },

        _restoreScheduleOptions: function() {

            var schedule = this.mission.schedule, days, hours, minutes;
            if (schedule) {
                days = schedule.days;
                hours = schedule.hours;
                minutes = schedule.minutes;
            }

            if (schedule && days && hours && minutes) {
                var options = this.scheduleOptions;

                var numGaps = 0, consecutiveHours, firstExcludedHour, lastExcludedHour;
                _.each(hours, function(hour, index) {
                    var previousHour = hours[index - 1];
                    if (index > 0 && hour > previousHour + 1) {
                        firstExcludedHour = previousHour + 1;
                        lastExcludedHour = hour - 1;
                        numGaps++;
                    }
                });

                var firstHour = hours[0], lastHour = hours[hours.length - 1];
                if (numGaps === 0) {
                    consecutiveHours = true;
                    firstExcludedHour = (lastHour < 23 ? lastHour + 1 : 0);
                    lastExcludedHour = (firstHour > 0 ? firstHour - 1 : 23);
                } else if (numGaps === 1 && firstHour === 0 && lastHour === 23) {
                    consecutiveHours = true;
                }

                if (minutes.length === 1) {
                    if (hours.length === 1) {
                        if (days.length === 1) {
                            options.scheduleType = "weekly";
                            options.day = days[0];
                            options.time = formatTime(hours[0], minutes[0]);
                        } else {
                            options.scheduleType = "daily";
                            options.exceptDays = (days.length < 7);
                            options.time = formatTime(hours[0], minutes[0]);
                        }
                    } else if (consecutiveHours) {
                        options.scheduleType = "hourly";
                        options.minute = minutes[0];
                        options.exceptHours = (hours.length < 24);
                        if (options.exceptHours) {
                            options.exceptHourStart = formatTime(firstExcludedHour, 0);
                            options.exceptHourEnd = formatTime(lastExcludedHour + 1, 0);
                        }
                        options.exceptDays = (days.length < 7);
                    } else {
                        options.scheduleType = "custom";
                    }
                } else {
                    options.scheduleType = "custom";
                }

                if (options.exceptDays && ["hourly", "daily"].indexOf(options.scheduleType) > -1) {
                    options.excludedDays = _.difference(_.range(7), days);
                }

                options.days = days;
                options.hours = hours;
                options.minutes = minutes;
            }
        },

        _save: function() {

            var $button = this.$(".action-save");
            $button.addClass("btn-progress");

            this._saveScheduleOptions();

            this.mission.save({ context: this }).then(function() {
                this.resolve();
            }, function(error) {
                this.showError(i18n("Could not save the mission"), error);
            }).always(function() {
                $button.removeClass("btn-progress");
            });
        },

        _saveScheduleOptions: function() {

            var mission = this.mission, days = [], hours = [], minutes = [];

            var options = this.scheduleOptions;
            switch (options.scheduleType) {
            case "manual":
                mission.schedule = null;
                break;
            case "hourly":
                if (options.exceptDays) {
                    days = _.difference(_.range(7), selectInts(this.$(".js-hourly-excluded-days")));
                }
                if (options.exceptHours) {
                    var startHour = _.parseInt(options.exceptHourStart.slice(0, 2));
                    if (_.parseInt(options.exceptHourStart.slice(3, 5)) > options.minute) {
                        startHour++;
                    }
                    var endHour = _.parseInt(options.exceptHourEnd.slice(0, 2));
                    if (_.parseInt(options.exceptHourEnd.slice(3, 5)) <= options.minute) {
                        endHour--;
                    }
                    if (startHour < endHour) {
                        hours = _.difference(_.range(24), _.range(startHour, endHour));
                    } else {
                        hours = _.range(endHour, startHour);
                    }
                }
                minutes = [options.minute];
                mission.schedule = { days: days, hours: hours, minutes: minutes };
                break;
            case "daily":
                if (options.exceptDays) {
                    days = _.difference(_.range(7), selectInts(this.$(".js-daily-excluded-days")));
                }
                hours = [_.parseInt(options.time.slice(0, 2))];
                minutes = [_.parseInt(options.time.slice(3, 5))];
                mission.schedule = { days: days, hours: hours, minutes: minutes };
                break;
            case "weekly":
                days = [this.$(".js-weekly-day").select2("data").id];
                hours = [_.parseInt(options.time.slice(0, 2))];
                minutes = [_.parseInt(options.time.slice(3, 5))];
                mission.schedule = { days: days, hours: hours, minutes: minutes };
                break;
            case "custom":
                days = selectInts(this.$(".js-custom-days"));
                hours = selectInts(this.$(".js-custom-hours"));
                minutes = selectInts(this.$(".js-custom-minutes"));
                mission.schedule = { days: days, hours: hours, minutes: minutes };
                break;
            }
        },

        _toggleAdvanced: function() {

            var $chevron = this.$(".js-advanced-chevron"), $advanced = this.$(".js-advanced");
            if ($chevron.hasClass("glyphicon-chevron-right")) {
                $chevron.removeClass("glyphicon-chevron-right").addClass("glyphicon-chevron-down");
                $advanced.show();
            } else {
                $chevron.removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-right");
                $advanced.hide();
            }
        },

        _toggleSchedule: function() {

            var $chevron = this.$(".js-schedule-chevron"), $schedule = this.$(".js-schedule");
            if ($chevron.hasClass("glyphicon-chevron-right")) {
                $chevron.removeClass("glyphicon-chevron-right").addClass("glyphicon-chevron-down");
                $schedule.show();
            } else {
                $chevron.removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-right");
                $schedule.hide();
            }
        }

    });

});
