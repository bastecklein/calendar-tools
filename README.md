# calendar-tools

Simple javascript module for creating calendars.  You can build the data out manually or use a string containing ical data as a source.

You can add calendar-tools to your project as an npm dependency or download the compiled version from the dist folder of this repo.

```json
"dependencies": {
    "calendar-tools": "git+ssh://git@github.com:bastecklein/calendar-tools.git#main"
}
```

## Usage

```javascript
// node
import { Calendar } from "calendar-tools";

// browser
import { Calendar } from "./calendar-tools.js";

const cal = new Calendar({
    data: icalString
});

// month starts at 0 for january
const ele = cal.toHTML({
    month: 2,   
    year: 2025
});

document.body.appendChild(ele);
```

Calendar will be a css grid formatted object, you can look at the classes and style to your needs.