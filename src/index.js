import { guid, createClassedElement } from "common-helpers";

const calDaysLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const calDaysLabelsMonday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const calMonthLabels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const calDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export class Calendar {
    constructor(options) {
        

        this.data = options.data || null;

        
        this.events = options.events || [];

        if(this.data) {
            parseCalendarData(this);
        }
    }

    getEventsForDay(date, events) {
        if(!events) {
            events = this.events;
        }

        if(!events || !events.length == 0) {
            return [];
        }

        const eventsForDay = [];

        for(let i = 0; i < events.length; i++) {
            const event = events[i];

            if(isEventOnDate(date, event)) {
                eventsForDay.push(event);
            }
        }

        return eventsForDay;
    }

    toIcal() {
        return calendarToIcal(this);
    }

    toHTML(options) {
        return calendarToDOM(options, this);
    }
}

export class CalendarEvent {
    constructor(options) {
        // spec: https://en.wikipedia.org/wiki/ICalendar
        // more: https://icalendar.org/RFC-Specifications/iCalendar-RFC-5545/

        const now = new Date();

        this.uid = options.uid || guid();

        this.data = options.data || null;

        this.timestamp = options.timestamp || now.getTime();

        this.created = options.created || now.getTime();
        this.lastModified = options.lastModified || now.getTime();

        this.startTime = options.startTime || now.getTime();
        this.endTime = options.endTime || now.getTime();

        // https://devguide.calconnect.org/iCalendar-Topics/Recurrences/
        this.rrule = options.rrule || null;

        this.summary = options.summary || null;
        this.description = options.description || null;
        this.categories = options.categories || [];
        this.cls = options.cls || null;
        this.transp = options.transp || null;
        this.organizer = options.organizer || null;
        this.geo = options.geo || null;
        this.status = options.status || null;
        this.location = options.location || null;
        this.sequence = options.sequence || null;
        this.url = options.url || null;


        this.ezOfficeIcon = options.ezOfficeIcon || null;

        if(this.data) {
            parseCalendarEvent(this);
        }
    }

    toIcal() {
        return eventToIcal(this);
    }
}

export class RRule {
    constructor(options) {

        this.data = options.data || null;

        this.freq = options.freq || null;
        this.interval = options.interval || null;
        this.count = options.count || null;
        this.until = options.until || null;

        this.wkst = options.wkst || null;

        this.byday = options.byday || null;
        this.bymonthday = options.bymonthday || null;
        this.bymonth = options.bymonth || null;

        if(this.data) {
            parseRRule(this);
        }
    }

    toIcal() {
        return rRuleToString(this);
    }
}

function isEventOnDate(date, event) {
    const month = date.getMonth();
    const year = date.getFullYear();
    const day = date.getDate();

    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);

    if(event.rrule && event.rrule.freq) {
        if(event.rrule.freq == "yearly") {
            const startMonth = startDate.getMonth();
            const startDay = startDate.getDate();

            if(startMonth == date.getMonth() && startDay == date.getDate()) {
                return true;
            }
        }

        if(event.rrule.freq == "monthly") {
            if(event.rrule.bymonthday && parseInt(event.rrule.bymonthday) > 0) {
                let monthLength = calDaysInMonth[month];

                if(month == 1 && ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0))) {
                    monthLength = 29;
                }

                const useDay = monthLength + parseInt(event.rrule.bymonthday) + 1;

                if(useDay == day) {
                    return true;
                }
            }

            const startDay = startDate.getDate();

            if(startDay == day) {
                return true;
            }
        }
    }

    const nowTime = date.getTime();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    if(nowTime >= startTime && nowTime <= endTime) {
        return true;
    }

    return false;
}

function parseCalendarData(calendarData) {
    const data = calendarData.data;

    if(!data) {
        return;
    }

    const events = [];

    const lines = data.split("\n");

    let currentEventData = null;
    let hasEvent = false;

    for(let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if(line.startsWith("BEGIN:VEVENT")) {
            currentEventData = "";
            hasEvent = true;
            continue;
        }

        if(line.startsWith("END:VEVENT")) {
            events.push(new CalendarEvent({
                data: currentEventData
            }));

            currentEventData = null;
            hasEvent = false;
            continue;
        }

        if(hasEvent) {
            currentEventData += line + "\n";
        }
    }

    calendarData.events = events;
}

function parseCalendarEvent(event) {
    const data = event.data;

    if(!data) {
        return;
    }

    const lines = data.split("\n");

    for(let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if(line.startsWith("BEGIN:")) {
            continue;
        }

        if(line.startsWith("END:")) {
            continue;
        }

        if(line.startsWith("UID:")) {
            event.uid = line.substring(4);
            continue;
        }

        if(line.startsWith("DTSTAMP:")) {
            event.timestamp = new Date(line.substring(8));
            continue;
        }

        if(line.startsWith("CREATED:")) {
            event.created = new Date(line.substring(8));
            continue;
        }

        if(line.startsWith("LAST-MODIFIED:")) {
            event.lastModified = new Date(line.substring(15));
            continue;
        }

        if(line.startsWith("DTSTART:")) {
            event.startTime = new Date(line.substring(8));
            continue;
        }

        if(line.startsWith("DTEND:")) {
            event.endTime = new Date(line.substring(6));
            continue;
        }

        if(line.startsWith("RRULE:")) {
            event.rrule = new RRule({
                data: line.substring(6)
            });

            continue;
        }

        if(line.startsWith("SUMMARY:")) {
            event.summary = line.substring(8);
            continue;
        }

        if(line.startsWith("DESCRIPTION:")) {
            event.description = line.substring(12);
            continue;
        }

        if(line.startsWith("CATEGORIES:")) {
            const categoriesRawString = line.substring(11);
            const categoriesRawArray = categoriesRawString.split(",");

            const categoriesArray = [];

            for(let j = 0; j < categoriesRawArray.length; j++) {
                const categoryRawString = categoriesRawArray[j];
                const categoryString = categoryRawString.trim();

                categoriesArray.push(categoryString);
            }

            event.categories = categoriesArray;

            continue;
        }

        if(line.startsWith("CLASS:")) {
            event.cls = line.substring(6);
            continue;
        }

        if(line.startsWith("TRANSP:")) {
            event.transp = line.substring(7);
            continue;
        }

        if(line.startsWith("ORGANIZER:")) {
            event.organizer = line.substring(11);
            continue;
        }

        if(line.startsWith("GEO:")) {
            event.geo = line.substring(4);
            continue;
        }

        if(line.startsWith("STATUS:")) {
            event.status = line.substring(7);
            continue;
        }

        if(line.startsWith("LOCATION:")) {
            event.location = line.substring(9);
            continue;
        }

        if(line.startsWith("SEQUENCE:")) {
            event.sequence = line.substring(9);
            continue;
        }

        if(line.startsWith("URL:")) {
            event.url = line.substring(4);
            continue;
        }

        if(line.startsWith("X-EZOFFICE-ICON:")) {
            event.ezOfficeIcon = line.substring(16);
            continue;
        }

        if(line.startsWith("BEGIN:")) {
            continue;
        }

        if(line.startsWith("END:")) {
            continue;
        }

        if(line.startsWith("X-")) {
            continue;
        }

        if(line.startsWith(" ")) {
            continue;
        }

        if(line.startsWith("\t")) {
            continue;
        }

        if(line.startsWith(":")) {
            continue;
        }

        if(line.startsWith(";")) {
            continue;
        }

        if(line.startsWith("#")) {
            continue;
        }

    }

}

function parseRRule(rRule) {
    const data = rRule.data;

    if(!data) {
        return;
    }

    const lines = data.split(";");

    for(let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if(line.startsWith("FREQ:")) {
            rRule.freq = line.substring(5);
            continue;
        }

        if(line.startsWith("INTERVAL:")) {
            rRule.interval = line.substring(9);
            continue;
        }

        if(line.startsWith("COUNT:")) {
            rRule.count = line.substring(6);
            continue;
        }

        if(line.startsWith("UNTIL:")) {
            rRule.until = line.substring(6);
            continue;
        }

        if(line.startsWith("WKST:")) {
            rRule.wkst = line.substring(5);
            continue;
        }

        if(line.startsWith("BYDAY:")) {
            rRule.byday = line.substring(6);
            continue;
        }

        if(line.startsWith("BYMONTHDAY:")) {
            rRule.bymonthday = line.substring(11);
            continue;
        }

        if(line.startsWith("BYMONTH:")) {
            rRule.bymonth = line.substring(8);
            continue;
        }
    }
}

function calendarToIcal(calendar) {
    const events = calendar.events;

    let ical = "BEGIN:VCALENDAR\n";
    ical += "VERSION:2.0\n";
    ical += "PRODID:-//EZ Office//NONSGML v1.0//EN\n";
    ical += "CALSCALE:GREGORIAN\n";

    for(let i = 0; i < events.length; i++) {
        const event = events[i];
        const eventString = eventToIcal(event);

        ical += eventString;

    }

    ical += "END:VCALENDAR\n";

    return ical;
}

function rRuleToString(rRule) {
    let rRuleString = "RRULE:";

    if(rRule.freq) {
        rRuleString += "FREQ:" + rRule.freq + ";";
    }

    if(rRule.interval) {
        rRuleString += "INTERVAL:" + rRule.interval + ";";
    }

    if(rRule.count) {
        rRuleString += "COUNT:" + rRule.count + ";";
    }

    if(rRule.until) {
        rRuleString += "UNTIL:" + rRule.until + ";";
    }

    if(rRule.wkst) {
        rRuleString += "WKST:" + rRule.wkst + ";";
    }

    if(rRule.byday) {
        rRuleString += "BYDAY:" + rRule.byday + ";";
    }

    if(rRule.bymonthday) {
        rRuleString += "BYMONTHDAY:" + rRule.bymonthday + ";";
    }

    if(rRule.bymonth) {
        rRuleString += "BYMONTH:" + rRule.bymonth + ";";
    }

    return rRuleString;
}

function eventToIcal(event) {
    let eventString = "BEGIN:VEVENT\n";

    eventString += "UID:" + event.uid + "\n";
    eventString += "DTSTAMP:" + event.timestamp.toISOString() + "\n";
    eventString += "CREATED:" + event.created.toISOString() + "\n";
    eventString += "LAST-MODIFIED:" + event.lastModified.toISOString() + "\n";
    eventString += "DTSTART:" + event.startTime.toISOString() + "\n";
    eventString += "DTEND:" + event.endTime.toISOString() + "\n";

    if(event.rrule) {
        eventString += "RRULE:" + rRuleToString(event.rrule) + "\n";
    }

    if(event.summary) {
        eventString += "SUMMARY:" + event.summary + "\n";
    }

    if(event.description) {
        eventString += "DESCRIPTION:" + event.description + "\n";
    }

    if(event.categories && Array.isArray(event.categories)) {
        const categoriesRawArray = [];

        for(let j = 0; j < event.categories.length; j++) {
            const category = event.categories[j];

            categoriesRawArray.push(category);
        }

        const categoriesRawString = categoriesRawArray.join(",");

        if(categoriesRawString) {
            eventString += "CATEGORIES:" + categoriesRawString + "\n";
        }
    }

    if(event.cls) {
        eventString += "CLASS:" + event.cls + "\n";
    }

    if(event.transp) {
        eventString += "TRANSP:" + event.transp + "\n";
    }

    if(event.organizer) {
        eventString += "ORGANIZER:" + event.organizer + "\n";
    }

    if(event.geo) {
        eventString += "GEO:" + event.geo + "\n";
    }

    if(event.status) {
        eventString += "STATUS:" + event.status + "\n";
    }

    if(event.location) {
        eventString += "LOCATION:" + event.location + "\n";
    }

    if(event.sequence) {
        eventString += "SEQUENCE:" + event.sequence + "\n";
    }

    if(event.url) {
        eventString += "URL:" + event.url + "\n";
    }

    if(event.ezOfficeIcon) {
        eventString += "X-EZOFFICE-ICON:" + event.ezOfficeIcon + "\n";
    }

    eventString += "END:VEVENT\n";

    return eventString;
}

function calendarToDOM(options, calendar) {
    const now = new Date();

    const year = options.year || now.getFullYear();
    const month = options.month || now.getMonth();

    const monthLabels = options.monthLabels || calMonthLabels;

    let firstDay = new Date(year, month, 1);
    let startingDay = firstDay.getDay();

    if(options.startMonday) {
        startingDay--;

        if(startingDay < 0) {
            startingDay = 6;
        }
    }

    let monthLength = calDaysInMonth[month];

    if(month == 1 && ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0))) {
        monthLength = 29;
    }

    const fullCal = createClassedElement("div", "calendar");

    let rowStyle = "";

    if(!options.noStyle) {
        fullCal.style.display = "grid";
        fullCal.style.gridTemplateColumns = "repeat(7, 1fr)";
    }

    if(!options.noTitle) {
        const title = createClassedElement("div", "calendar-title");
        title.innerHTML = monthLabels[month] + " " + year;

        if(!options.noStyle) {
            title.style.gridColumn = "1 / span 7";
        }

        fullCal.appendChild(title);

        rowStyle += "auto ";
    }

    if(!options.noDayLabels) {
        const dayLabels = options.startMonday ? calDaysLabelsMonday : calDaysLabels;

        for(let i = 0; i < dayLabels.length; i++) {

            let weekendClass = "";

            if(i == 0 || i == 6) {
                weekendClass = " calendar-day-label-weekend";
            }

            const dayLabel = createClassedElement("div", "calendar-day-label" + weekendClass);
            dayLabel.innerHTML = dayLabels[i];

            fullCal.appendChild(dayLabel);
        }

        rowStyle += "auto ";
    }


    let day = 1;
    let evenWeek = true;
    let weekClass = "";

    let moreWeeks = true;
    let firstWeek = true;

    while(moreWeeks) {
        if(evenWeek) {
            weekClass = " calendar-week-even";
        } else {
            weekClass = " calendar-week-odd";
        }

        evenWeek = !evenWeek;

        for(let i = 0; i < 7; i++) {
            let weekendClass = "";

            if(i == 0 || i == 6) {
                weekendClass = " calendar-day-weekend";
            } else {
                weekendClass = " calendar-day-weekday";
            }

            if(day > monthLength) {
                moreWeeks = false;
                fullCal.appendChild(createClassedElement("div", "calendar-date-empty" + weekClass + weekendClass));
            } else {
                if(firstWeek && i < startingDay) {
                    fullCal.appendChild(createClassedElement("div", "calendar-date-empty" + weekClass + weekendClass));
                } else {
                    

                    const dateBox = createClassedElement("div", "calendar-date" + weekClass + weekendClass);

                    if(day == now.getDate() && month == now.getMonth() && year == now.getFullYear()) {
                        dateBox.classList.add("calendar-date-today");
                    }

                    if(!options.noDateLabels) {
                        const dateLabel = createClassedElement("div", "calendar-date-label");
                        dateLabel.innerHTML = day;

                        dateBox.appendChild(dateLabel);
                    }

                    if(!options.noEvents) {
                        const dateEvents = calendar.getEventsForDay(new Date(year, month, day));

                        if(dateEvents.length > 0) {
                            const eventsBox = createClassedElement("div", "calendar-date-events");

                            for(let j = 0; j < dateEvents.length; j++) {
                                const event = dateEvents[j];

                                const eventItem = createClassedElement("div", "calendar-date-event");
                                
                                if(event.ezOfficeIcon) {
                                    const icon = createClassedElement("img", "calendar-date-event-icon");
                                    icon.src = event.ezOfficeIcon;
                                    eventItem.appendChild(icon);
                                }

                                const eventLabel = createClassedElement("div", "calendar-date-event-label", event.summary);
                                eventItem.appendChild(eventLabel);

                                eventsBox.appendChild(eventItem);
                            }

                            dateBox.appendChild(eventsBox);
                        }
                    }
                }
            }
        }


        firstWeek = false;
    }


    if(!options.noStyle) {
        fullCal.style.gridTemplateRows = rowStyle;
    }

    return fullCal;
}

export default {
    Calendar,
    CalendarEvent,
    RRule
};