import { signal } from "@angular/core";

export class CommonConstants {
    // UI constant
    public static AVAILABLE_LOCALES = "AvailableLocale";
    public static LIGHT_THEME = "light";
    public static DARK_THEME = "dark";
    public static EPIC_THEME = "epic";


    // layer const
    public static APP_LAYER = "App";
    public static TOPBAR_LAYER = "TopBar";
    public static HOME_LAYER = "Home";

}

export const projectLogo = 'assets/images/logo.png'; 
export const numberFormat = signal('1.4-4');
export const numberFormat02 = signal('1.0-2');
export const numberLocale = signal('en-US');
export const dateFormat = signal('DD-MM-YYYY');
export const foreignOrDomestic = signal("DOMESTIC");
export const currencySymbol = signal('AED');
export const decimalDigits = signal(6);
