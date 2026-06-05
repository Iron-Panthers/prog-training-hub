export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

export function formatDateValue(value: string | number | Date | null | undefined) {
    if (value == null || value === "") return "Unknown date";

    let date: Date;
    if (value instanceof Date) {
        date = value;
    } else if (typeof value === "number") {
        date = new Date(value < 1e12 ? value * 1000 : value);
    } else {
        date = new Date(value);
        if (Number.isNaN(date.valueOf())) {
            const numeric = Number(value);
            if (!Number.isNaN(numeric)) {
                date = new Date(numeric < 1e12 ? numeric * 1000 : numeric);
            }
        }
    }

    return Number.isNaN(date.valueOf()) ? "Unknown date" : date.toLocaleDateString();
}