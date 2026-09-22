
import { TimeSheetDetailsEnum } from "src/app/modules/hrm-main/hrm-enum/attendance.enum"
import { GraceDetailsModel } from "src/app/modules/hrm-shared/core/shared/common/model/hrm/grace-details.model";

export enum Status {
    WeeklyOffOvertime = 11, // if it is week of sunday and has worked 
    WeeklyOff = 17, // if is sunday
    HolidayOvertime = 19, // if it is holiday from holiday master and worked
    Holiday = 18, // if it is holiday from holiday master
    Absent = 4, // if worked hrs is 0
    SwipeMiss = 5, // if its not today and then out time or in time is 00:00 then this status
    LateAndLeftEarly = 3, // if shift in time is for worker 7:00 and for staff 9:00 if its late than that and also shift out time is 19:00 s for worker and 18:00 is for staff if theyw went early than this show this status
    LeftEarly = 2, //shift out time is 19:00 s for worker and 18:00 is for staff if theyw went early than this show this status
    LateToday = 16, // if a person is punched in today and if shift in time is for worker 7:00 and for staff 9:00 if its late and logout time is still 0 
    LateAndOvertime = 7, //if shift in time is for worker 7:00 and for staff 9:00 if its late and ot1 or ot2 >0 and worked hrs >0 then show this status
    RegularAndOvertime = 6, // if ot1 or ot2 present and  > 0 of an emplyee 
    OnTime = 0, // if it is today and person is punched in and punch out stil  0 then this status
    Late = 1, //if a person comes late and left late but not over time,
    // OnTime = 14, // if it is today and person is punched in and punch out stil  0 then this status

    YetToPunchToday = 15,
    WorkedOnOffDay = 24,
    Break = -1,

    LOP = 22,
    SPLLeave = 23,
    LeaveAccident = 62,
    CasualLeave = 64,
    CompassionateLeave = 65,
    WorkFromHome = 68,
    LeaveEncashmentDays = 69,
    OfficialTrip = 71,
    SickLeaveHalf = 73,
    SickLeaveUnpaid = 74,
    StudyLeave = 75,
    UnpaidLeave = 76,
    NationalServiceLeave = 1061,
    AnnualLeave = 8,
    SickLeave = 9,
    EmergencyLeave = 10,
    HalfDaySickLeave = 20,
    MaternityLeave = 21,
    Duty = 102,
    HolidayCompOff = 12,
    CompensatoryOff = 13
}

interface GraceDetailsFilterParams {
    punch_in_date: string;
    emp_type: string;
    emp_group: string;
    emp_reporting: string;
}
export class TimesheetCalculator {


    private shift: Record<string, Record<string, { shift_in: string; shift_out: string }>> = {
        Worker: {
            day_shift: {
                shift_in: "07:00",
                shift_out: "19:00"
            },
            night_shift: {
                shift_in: "19:00",
                shift_out: "07:00"
            }
        },
        Staff: {
            general_shift: {
                shift_in: "09:00",
                shift_out: "19:00"
            }
        }
    };


    constructor(private holidayList: any[],private graceDetails: any[]) {
    }

    calculateTimeSheetRowData(rowData: any, timeSheetList: any[] = []): any {
        const loginTimeStr = rowData[TimeSheetDetailsEnum.loginTime];
        const logoutTimeStr = rowData[TimeSheetDetailsEnum.logoutTime];
        const workingTime = rowData[TimeSheetDetailsEnum.workingTime];
        const punchInDateStr = rowData[TimeSheetDetailsEnum.date];

        if (!loginTimeStr || !logoutTimeStr || !workingTime) {
            console.warn('Invalid data provided.');
            return rowData;
        }

        const loginTime = this.parseTime(loginTimeStr);
        const logoutTime = this.parseTime(logoutTimeStr);
        const punchInDate = this.parseDate(punchInDateStr);
        console.log("login time and logout time",loginTime,logoutTime)
        const params: GraceDetailsFilterParams = {
            punch_in_date: rowData?.date,
            emp_type: rowData?.employee_type,
            emp_group: rowData?.employee_group,
            emp_reporting: rowData?.reporting,
        };
        
        const result = this.getGraceDetailsByMaster(this.graceDetails, params);
        const graceDetails=this.assignGraceDetails(result);
        console.log("result",graceDetails)

        let workedMinutes = this.calculateWorkedMinutes(loginTime, logoutTime);
        const isHoliday = this.checkIfHoliday(punchInDate,rowData);
        let break_time = graceDetails?.break_time;
        if (isHoliday){
            break_time = graceDetails?.wo_break_time;
        }
        workedMinutes = Math.max(0, workedMinutes - break_time);
        const workedHours = this.formatMinutesToTime(workedMinutes);
        const rawOvertimeMinutes = Math.max(0, workedMinutes - workingTime);

        if (workedMinutes > 0) {
            let overtimeMinutes = rawOvertimeMinutes;
            let max_ot=this.getMaximumOtMins(loginTime,logoutTime,graceDetails);
            if (!isHoliday) {
                // console.log("max ot",max_ot)
                overtimeMinutes = this.applyOtRounding(rawOvertimeMinutes,max_ot);
            }

             let otHours  = this.calculateOvertime(overtimeMinutes);

            let { lessHrs, lessMinutes } = this.calculateLessHours(workingTime, workedMinutes);

            let { extraHrs, extraMinutes } = this.calculateExtraHours(workedMinutes, workingTime,max_ot);

            if(!rowData?.is_ot_eligible){
                overtimeMinutes=0;
                otHours='00:00';
            }

            if (isHoliday) {
                let max_ot=this.getMaximumtHotMins(loginTime,logoutTime,graceDetails);
                this.handleHoliday(rowData, workedMinutes,max_ot);
            }
            else if (loginTime > logoutTime && logoutTimeStr != '00:00') {
                this.handleLoginAfterLogout(rowData, otHours, lessHrs, extraHrs, workedHours, overtimeMinutes, lessMinutes, extraMinutes, workedMinutes);
            } else {
                this.handleRegularCase(rowData, otHours, lessHrs, extraHrs, workedHours, overtimeMinutes, lessMinutes, extraMinutes, workedMinutes);
            }
        }
        else {
            this.clearValues(rowData)
        }

        this.updateRowStatus(rowData, punchInDate)
        this.applyLopOnAbsent(rowData, timeSheetList)



    }

    private parseTime(timeStr: string): Date {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const time = new Date();
        time.setHours(hours, minutes, 0, 0);
        return time;
    }

    private calculateWorkedMinutes(loginTime: Date, logoutTime: Date): number {
        let workedMinutes = (logoutTime.getHours() * 60 + logoutTime.getMinutes()) -
            (loginTime.getHours() * 60 + loginTime.getMinutes());

        if (workedMinutes < 0) {
            workedMinutes += 24 * 60; // Handle shifts crossing midnight
        }
        return workedMinutes;
    }

    private formatMinutesToTime(totalMinutes: number): string {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${this.padZero(hours)}:${this.padZero(minutes)}`;
    }

    private padZero(num: number): string {
        return num.toString().padStart(2, '0');
    }

    private parseDate(dateStr: string): Date {
        console.log("date str", dateStr)
        const [day, month, year] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    private checkIfHoliday(punchInDate: Date,rowData): boolean {
        const isSunday = this.checkIfWeeklyOff(punchInDate,rowData?.weekly_off);
        const isHoliday = this.checkOnlyHoliday(punchInDate);
        return isSunday || isHoliday;
    }

dayNameToWeekday(dayName: string): number {
        const dayMap: { [key: string]: number } = {
            "monday": 1,
            "tuesday": 2,
            "wednesday": 3,
            "thursday": 4,
            "friday": 5,
            "saturday": 6,
            "sunday": 0
        };
        return dayMap[dayName.toLowerCase()] ?? -1;
    }
    
 checkIfWeeklyOff(punchInDate: Date, weeklyOff: string): boolean {
        try {
            const weeklyOffDays: string[] = JSON.parse(weeklyOff);
            // console.log("weekly off",weeklyOff)
            if (!weeklyOffDays || weeklyOffDays.length === 0) {
                return punchInDate.getDay() === 0;
            }
            const punchInWeekday = punchInDate.getDay();
            for (const dayName of weeklyOffDays) {
                if (punchInWeekday === this.dayNameToWeekday(dayName)) {
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error("Invalid weekly_off format. Expected a JSON-like array string.");
            return punchInDate.getDay() === 0;
        }
    }

    applyOtRounding(otMinutes: number,max_ot): number {
        const fullHours = Math.floor(otMinutes / 60);
        const remainingMinutes = otMinutes % 60;

        let roundedMinutes = 0;

        if (remainingMinutes >= 1 && remainingMinutes <= 14) {
            roundedMinutes = 0;
        } else if (remainingMinutes >= 15 && remainingMinutes <= 30) {
            roundedMinutes = 30;
        } else if (remainingMinutes >= 31 && remainingMinutes <= 44) {
            roundedMinutes = 30;
        } else if (remainingMinutes >= 45 && remainingMinutes <= 60) {
            roundedMinutes = 60;
        }

        const totalMinutes = (fullHours * 60) + roundedMinutes;

        if (totalMinutes > max_ot) {
            return max_ot;
        }

        return totalMinutes;
    }

    handleHoliday(rowData, workedMinutes,max_ot) {
        let hotMinutes = max_ot;
        if (workedMinutes < max_ot) {
            hotMinutes = this.applyOtRounding(workedMinutes,max_ot);
        }
        const hotHrs = this.formatMinutesToTime(hotMinutes);
        const conTotalHrs = this.formatMinutesToTime(workedMinutes);
        rowData[TimeSheetDetailsEnum.conHotHrs] = rowData?.is_ot_eligible?hotHrs:'00:00';
        rowData[TimeSheetDetailsEnum.comOt2Hrs] = '00:00';
        rowData[TimeSheetDetailsEnum.conOtHrs] = '00:00';
        rowData[TimeSheetDetailsEnum.conLessHrs] = '00:00';
        rowData[TimeSheetDetailsEnum.conExtraHrs] = '00:00';
        rowData[TimeSheetDetailsEnum.ot2Hrs] = 0;
        rowData[TimeSheetDetailsEnum.otHrs] = 0;
        rowData[TimeSheetDetailsEnum.lessHrs] = 0;
        rowData[TimeSheetDetailsEnum.extraHrs] = 0;
        rowData[TimeSheetDetailsEnum.conTotalHours] = conTotalHrs;
        rowData[TimeSheetDetailsEnum.totalHours] = workedMinutes;
        rowData[TimeSheetDetailsEnum.hotHrs] = rowData?.is_ot_eligible?hotMinutes:0;
    }

    handleRegularCase(rowData, otHours, lessHrs, extraHrs, workedHours, overtimeMinutes, lessMinutes, extraMinutes, workedMinutes) {
        rowData[TimeSheetDetailsEnum.conOtHrs] = otHours;
        rowData[TimeSheetDetailsEnum.otHrs] = overtimeMinutes;
        rowData[TimeSheetDetailsEnum.conHotHrs] = '00:00';
        rowData[TimeSheetDetailsEnum.comOt2Hrs] = '00:00';
        rowData[TimeSheetDetailsEnum.ot2Hrs] = 0;
        rowData[TimeSheetDetailsEnum.hotHrs] = 0;
        rowData[TimeSheetDetailsEnum.conLessHrs] = lessHrs;
        rowData[TimeSheetDetailsEnum.lessHrs] = lessMinutes;
        rowData[TimeSheetDetailsEnum.conExtraHrs] = extraHrs;
        rowData[TimeSheetDetailsEnum.extraHrs] = extraMinutes;
        rowData[TimeSheetDetailsEnum.conTotalHours] = workedHours;
        rowData[TimeSheetDetailsEnum.totalHours] = workedMinutes;
    }

    handleLoginAfterLogout(rowData, otHours, lessHrs, extraHrs, workedHours, overtimeMinutes, lessMinutes, extraMinutes, workedMinutes) {
        rowData[TimeSheetDetailsEnum.comOt2Hrs] = otHours;
        rowData[TimeSheetDetailsEnum.ot2Hrs] = overtimeMinutes;
        rowData[TimeSheetDetailsEnum.conHotHrs] = '00:00';
        rowData[TimeSheetDetailsEnum.hotHrs] = 0;
        rowData[TimeSheetDetailsEnum.conOtHrs] = '00:00';
        rowData[TimeSheetDetailsEnum.otHrs] = 0;
        rowData[TimeSheetDetailsEnum.conLessHrs] = lessHrs;
        rowData[TimeSheetDetailsEnum.lessHrs] = lessMinutes;
        rowData[TimeSheetDetailsEnum.conExtraHrs] = extraHrs;
        rowData[TimeSheetDetailsEnum.extraHrs] = extraMinutes;
        rowData[TimeSheetDetailsEnum.conTotalHours] = workedHours;
        rowData[TimeSheetDetailsEnum.totalHours] = workedMinutes;
    }

    calculateOvertime(overtimeMinutes) {
        let otHours = '00:00';
        if (overtimeMinutes > 0) {
            otHours = this.formatMinutesToTime(overtimeMinutes);
        }
        return otHours;
    }

    calculateLessHours(workingTime, workedMinutes) {
        let lessHrs = '00:00';
        let lessMinutes = 0;
        if (workedMinutes < workingTime) {
            lessMinutes = Math.max(0, workingTime - workedMinutes);
            lessHrs = this.formatMinutesToTime(lessMinutes);
        }
        return { lessHrs, lessMinutes };
    }

    calculateExtraHours(workedMinutes, workingTime,max_ot) {
        const fixedOtHours = max_ot;
        const extraMinutes = Math.max(0, workedMinutes - workingTime - fixedOtHours);
        let extraHrs = '00:00';

        if (extraMinutes > 0) {
            extraHrs = this.formatMinutesToTime(extraMinutes);
        }
        return { extraHrs, extraMinutes };
    }


    private checkOnlyHoliday(punchInDate: Date): boolean {
        const isHoliday = this.holidayList.some(holiday => {
            // Manually parse the date in DD-MM-YYYY format
            const [day, month, year] = holiday.date.split('-').map(Number);
            const [toDay, toMonth, toYear] = holiday.to_date.split('-').map(Number);
    
            // Create Date objects correctly with (year, month-1, day)
            const holidayFrom = new Date(year, month - 1, day);
            const holidayTo = new Date(toYear, toMonth - 1, toDay);
    
            console.log("punchInDate: ", punchInDate, "holidayFrom: ", holidayFrom, "holidayTo: ", holidayTo);
            
            return punchInDate >= holidayFrom && punchInDate <= holidayTo;
        });
    
        return isHoliday;
    }
    
    private checkIfSunday(punchInDate: Date): boolean {
        const isSunday = punchInDate.getDay() === 0;
        return isSunday;
    }


    convertToDate(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        date.setSeconds(0);
        date.setMilliseconds(0);
        return date;
    }

    clearValues(rowData) {
        rowData[TimeSheetDetailsEnum.comOt2Hrs] = "00:00";
        rowData[TimeSheetDetailsEnum.ot2Hrs] = 0;
        rowData[TimeSheetDetailsEnum.conHotHrs] = '00:00';
        rowData[TimeSheetDetailsEnum.hotHrs] = 0;
        rowData[TimeSheetDetailsEnum.conOtHrs] = '00:00';
        rowData[TimeSheetDetailsEnum.otHrs] = 0;
        rowData[TimeSheetDetailsEnum.conLessHrs] = "00:00";
        rowData[TimeSheetDetailsEnum.lessHrs] = 0;
        rowData[TimeSheetDetailsEnum.conExtraHrs] = "00:00";
        rowData[TimeSheetDetailsEnum.extraHrs] = 0;
        rowData[TimeSheetDetailsEnum.conTotalHours] = "00:00";
        rowData[TimeSheetDetailsEnum.totalHours] = 0;
    }


    updateRowStatus(rowData, punchInDate) {


        const isMidnight = (date) => date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0;

        const workedHrs = rowData[TimeSheetDetailsEnum.totalHours];
        const baseHrs = rowData[TimeSheetDetailsEnum.workingTime];
        const loginTimeStr = rowData[TimeSheetDetailsEnum.loginTime];
        const logoutTimeStr = rowData[TimeSheetDetailsEnum.logoutTime];
        let shiftInStr = rowData[TimeSheetDetailsEnum.shiftIn];
        let shiftOutStr = rowData[TimeSheetDetailsEnum.shiftOut];

        if (shiftInStr == '00:00' && shiftOutStr == '00:00') {
            ({ shiftInStr, shiftOutStr } = this.getShiftDetailsIfNotExist(loginTimeStr));
            console.log("shift in str", shiftInStr, shiftOutStr)
        }

        const shiftIn = this.convertToDate(shiftInStr);
        const shiftOut = this.convertToDate(shiftOutStr);

        const loginTime = this.convertToDate(loginTimeStr);
        const logoutTime = this.convertToDate(logoutTimeStr);
        // console.log("regular over times checl", rowData[TimeSheetDetailsEnum.ot2Hrs], rowData[TimeSheetDetailsEnum.otHrs])
        const onlyOneSwipe = (logoutTimeStr === '00:00') !== (loginTimeStr === '00:00');


        if (!this.isToday(punchInDate) && onlyOneSwipe) {
            rowData[TimeSheetDetailsEnum.status] = Status.SwipeMiss;
          }
        // Check if it's Sunday
        else if (this.checkIfWeeklyOff(punchInDate,rowData?.weekly_off)) {
            if (rowData[TimeSheetDetailsEnum.totalHours] > 0) {
                rowData[TimeSheetDetailsEnum.status] = Status.WeeklyOffOvertime; // Sunday with worked hours
            } else {
                rowData[TimeSheetDetailsEnum.status] = Status.WeeklyOff; // Regular Sunday
            }
        }

        // Check if it's a Holiday
        else if (this.checkOnlyHoliday(punchInDate)) {
            if (rowData[TimeSheetDetailsEnum.totalHours] > 0) {
                rowData[TimeSheetDetailsEnum.status] = Status.HolidayOvertime; // Holiday with worked hours
            } else {
                rowData[TimeSheetDetailsEnum.status] = Status.Holiday; // Regular Holiday
            }
        }

        // Check if worked hours are 0 (Absent)
        else if (workedHrs == 0) {
            rowData[TimeSheetDetailsEnum.status] = Status.Absent; // Absent
        }

        // // Check if it's a Swipe Miss
        // else if (!this.isToday(punchInDate) && (logoutTimeStr == '00:00' || loginTimeStr == '00:00')) {
        //     rowData[TimeSheetDetailsEnum.status] = Status.SwipeMiss; // Swipe Miss
        // }

        // Check if the employee is Late and Left Early
        else if (this.isLate(loginTime, shiftIn) && this.isLeftEarly(workedHrs, baseHrs)) {
            rowData[TimeSheetDetailsEnum.status] = Status.LateAndLeftEarly; // Late and Left Early
        }

        // Check if the employee Left Early
        else if (this.isLeftEarly(workedHrs, baseHrs)) {
            rowData[TimeSheetDetailsEnum.status] = Status.LeftEarly; // Left Early
        }

        // Check if the employee is Late Today
        // else if (this.isLate(loginTime, shiftIn) && this.isToday(punchInDate) && isMidnight(logoutTime)) {
        //     rowData[TimeSheetDetailsEnum.status] = Status.LateToday; // Late Today
        // }

        // // Check if the employee is Late and has Overtime
        // else if (this.isLate(loginTime, shiftIn) && (rowData[TimeSheetDetailsEnum.otHrs] > 0 || rowData[TimeSheetDetailsEnum.ot2Hrs] > 0)) {
        //     rowData[TimeSheetDetailsEnum.status] = Status.LateAndOvertime; // Late and Overtime
        // }


        // Check if the employee has Regular Overtime
        else if (rowData[TimeSheetDetailsEnum.otHrs] > 0 || rowData[TimeSheetDetailsEnum.ot2Hrs] > 0) {
            rowData[TimeSheetDetailsEnum.status] = Status.RegularAndOvertime; // Regular Overtime
        }

        // Default to OnTime
        else {
            rowData[TimeSheetDetailsEnum.status] = Status.OnTime; // On Time
        }

        return rowData;
    }

    // Function to check if the provided date is today's date
    isToday(punchInDate) {
        const today = new Date();
        // const dateToCheck = this.parseDate(punchInDate);;
        return today.toDateString() === punchInDate.toDateString();
    }

    // Function to check if the employee is late
    // Compares login time with the shift-in time
    isLate(loginTime, shiftIn) {
        return loginTime > shiftIn; // If login time is after shift-in time, the employee is late
    }

    // Function to check if the employee has left early
    // Compares workedHours with the basehrs
    isLeftEarly(workedHours, basehrs) {
        return workedHours < basehrs; // If workedHours is before basehrs, the employee left early
    }

    // Function to check if the provided date is 00:00:00 (midnight)
    isMidnight(date) {
        return date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0;
    }


    getShiftDetailsIfNotExist(loginTime) {
        loginTime = this.convertTimeToMinutes(loginTime);
        const noonTime = this.convertTimeToMinutes("12:00");
        let shiftInStr = '00:00';
        let shiftOutStr = '00:00';
        if (loginTime > 0 && loginTime < noonTime) {
            // Day Shift (Before 12:00 PM)
            shiftInStr = '07:00';
            shiftOutStr = '19:00';
        } else if (loginTime >= noonTime) {
            // Night Shift (After 12:00 PM)
            shiftInStr = '19:00';
            shiftOutStr = '07:00';
        }
        return { shiftInStr, shiftOutStr }
    }

    convertTimeToMinutes(time: string): number {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }


    onChangeStatus(rowData) {
        const status = rowData[TimeSheetDetailsEnum.status];
    
        if (status == Status.WeeklyOff || status == Status.Holiday) {
            this.clearValues(rowData);
            rowData[TimeSheetDetailsEnum.loginTime] = "00:00";
            rowData[TimeSheetDetailsEnum.logoutTime] = "00:00";
            rowData[TimeSheetDetailsEnum.workingTime] = 0;
            rowData[TimeSheetDetailsEnum.conWorkingTime] = "00:00";
        } 
        else if (
            status == Status.Absent || status == Status.LOP || 
            status == Status.SPLLeave || status == Status.LeaveAccident || 
            status == Status.CasualLeave || status == Status.CompassionateLeave || 
            status == Status.SickLeaveUnpaid || status == Status.StudyLeave || 
            status == Status.UnpaidLeave || status == Status.NationalServiceLeave || 
            status == Status.AnnualLeave || status == Status.SickLeave || 
            status == Status.EmergencyLeave || status == Status.MaternityLeave
        ) {
            this.clearValues(rowData);
            rowData[TimeSheetDetailsEnum.loginTime] = "00:00";
            rowData[TimeSheetDetailsEnum.logoutTime] = "00:00";
        }
    }



    getGraceDetailsByMaster(
        graceDetails: GraceDetailsModel[],
        params: GraceDetailsFilterParams
    ): GraceDetailsModel | null {
        const { punch_in_date, emp_type, emp_group, emp_reporting } = params;
        console.log("punch date",punch_in_date)
        const punchInDate = new Date(punch_in_date.split("-").reverse().join("-")); 
        const specialGraceDetails = graceDetails.filter((detail) => {
            console.log("detail.from_date",detail?.from_date,detail?.to_date)
            if (!detail.from_date || !detail.to_date) {
                return false; 
            }
    
            // Convert from_date and to_date to Date objects
            const fromDate = new Date(detail.from_date.split("-").reverse().join("-"));
            const toDate = new Date(detail.to_date.split("-").reverse().join("-"));
            return (
                detail.type === 'Special' &&
                punchInDate >= fromDate &&
                punchInDate <= toDate &&
                (detail.emp_type === emp_type || detail.emp_type === 'All') &&
                (detail.emp_group === emp_group || detail.emp_group === 'All') &&
                (detail.emp_reporting === emp_reporting || detail.emp_reporting === 'All')
            );
        });
    

        if (specialGraceDetails.length > 0) {
            specialGraceDetails.sort((a, b) => {
                const priorityA = this.calculatePriority(a, emp_type, emp_group, emp_reporting);
                const priorityB = this.calculatePriority(b, emp_type, emp_group, emp_reporting);
                return priorityA - priorityB;
            });
            return specialGraceDetails[0];
        }
    
        const normalGraceDetails = graceDetails.filter((detail) => {
            return (
                detail.type === 'Normal' &&
                (detail.emp_type === emp_type || detail.emp_type === 'All') &&
                (detail.emp_group === emp_group || detail.emp_group === 'All') &&
                (detail.emp_reporting === emp_reporting || detail.emp_reporting === 'All')
            );
        });
    
        if (normalGraceDetails.length > 0) {
            normalGraceDetails.sort((a, b) => {
                const priorityA = this.calculatePriority(a, emp_type, emp_group, emp_reporting);
                const priorityB = this.calculatePriority(b, emp_type, emp_group, emp_reporting);
                return priorityA - priorityB;
            });
            return normalGraceDetails[0];
        }

        return null;
    }


    calculatePriority(
        detail: GraceDetailsModel,
        emp_type: string,
        emp_group: string,
        emp_reporting: string
    ): number {
        if (
            detail.emp_type === emp_type &&
            detail.emp_group === emp_group &&
            detail.emp_reporting === emp_reporting
        ) {
            return 1; 
        } else if (detail.emp_type === emp_type && detail.emp_group === emp_group) {
            return 2;
        } else if (detail.emp_type === emp_type && detail.emp_reporting === emp_reporting) {
            return 3;
        } else if (detail.emp_group === emp_group && detail.emp_reporting === emp_reporting) {
            return 4; 
        } else if (detail.emp_type === emp_type) {
            return 5; 
        } else if (detail.emp_group === emp_group) {
            return 6; 
        } else if (detail.emp_reporting === emp_reporting) {
            return 7;
        } else {
            return 8; 
        }
    }

    assignGraceDetails(master_grace_details) {
        const graceDetails = {
            'min_work_mins': master_grace_details?.min_work_mins ?? 480,
            'max_work_mins': master_grace_details?.max_work_mins ?? 600,
            'break_time': master_grace_details?.break_time ?? 120,
            'wo_break_time': master_grace_details?.wo_break_time ?? 120,
            'max_day_ot_mins': master_grace_details?.max_day_ot_mins ?? 120,
            'max_night_ot_mins': master_grace_details?.max_night_ot_mins ?? 120,
            'weekly_off_work_mins': master_grace_details?.weekly_off_work_mins ?? 0,
            'wo_max_day_ot_mins': master_grace_details?.wo_max_day_ot_mins ?? 600,
            'wo_max_night_ot_mins': master_grace_details?.wo_max_night_ot_mins ?? 600,
            'total_work_hours': master_grace_details?.total_work_hours ?? 720,
            'lop_on_absent': master_grace_details?.lop_on_absent ?? false,
        };
        return graceDetails;
    }

    applyLopOnAbsent(rowData: any, timeSheetList: any[]): void {
        if (!timeSheetList?.length) return;

        const params: GraceDetailsFilterParams = {
            punch_in_date: rowData?.date,
            emp_type: rowData?.employee_type,
            emp_group: rowData?.employee_group,
            emp_reporting: rowData?.reporting,
        };
        const masterGrace = this.getGraceDetailsByMaster(this.graceDetails, params);
        const graceDetails = this.assignGraceDetails(masterGrace);

        if (!graceDetails.lop_on_absent) return;

        const empCode = rowData?.[TimeSheetDetailsEnum.employeeCode];
        const editedDateStr = rowData?.[TimeSheetDetailsEnum.date]; // 'DD-MM-YYYY'
        const totalHours = rowData?.[TimeSheetDetailsEnum.totalHours] ?? 0;
        const isNowAbsent = Number(totalHours) === 0;

        // Build date→row map for this employee
        const empRows: Map<string, any> = new Map();
        for (const row of timeSheetList) {
            if (row?.[TimeSheetDetailsEnum.employeeCode] === empCode && row?.[TimeSheetDetailsEnum.status] !== '-1') {
                empRows.set(row[TimeSheetDetailsEnum.date], row);
            }
        }

        const parseDate = (s: string): Date => {
            const [d, m, y] = s.split('-').map(Number);
            return new Date(y, m - 1, d);
        };
        const formatDate = (dt: Date): string => {
            const dd = String(dt.getDate()).padStart(2, '0');
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            return `${dd}-${mm}-${dt.getFullYear()}`;
        };

        const editedDate = parseDate(editedDateStr);
        let checkDate = new Date(editedDate);
        checkDate.setDate(checkDate.getDate() + 1);

        for (let i = 0; i < 14; i++) {
            const row = empRows.get(formatDate(checkDate));
            if (!row) break;

            const rowStatus = Number(row[TimeSheetDetailsEnum.status]);

            if (rowStatus === Status.Holiday || rowStatus === Status.HolidayOvertime) {
                checkDate.setDate(checkDate.getDate() + 1);
                continue;
            }

            if (rowStatus === Status.WeeklyOff || rowStatus === Status.LOP) {
                const rowHours = Number(row[TimeSheetDetailsEnum.totalHours] ?? 0);
                if (rowHours > 0) break;

                row[TimeSheetDetailsEnum.status] = isNowAbsent ? Status.LOP : Status.WeeklyOff;
                row.editing = true;
            } else {
                break;
            }

            checkDate.setDate(checkDate.getDate() + 1);
        }
    }

    getMaximumOtMins(loginTime, logoutTime, graceMasterData): number {
        const noonTime = new Date();
        noonTime.setHours(12, 0, 0, 0); 
    
        const midnightTime = new Date();
        midnightTime.setHours(0, 0, 0, 0); 
    
    
        let isNightOt = false;
    
        if (loginTime.getTime() > noonTime.getTime() && logoutTime.getTime() >= midnightTime.getTime()) {
            isNightOt = true;
        }
        // console.log("is night",isNightOt)
        if (isNightOt) {
            return graceMasterData.max_night_ot_mins??120;
        } else {
            return graceMasterData.max_day_ot_mins??120;
        }
    }


    getMaximumtHotMins(loginTime, logoutTime, graceMasterData): number {
        const noonTime = new Date();
        noonTime.setHours(12, 0, 0, 0); 
    
        const midnightTime = new Date();
        midnightTime.setHours(0, 0, 0, 0); 
    
    
        let isNightOt = false;
    
        if (loginTime.getTime() > noonTime.getTime() && logoutTime.getTime() >= midnightTime.getTime()) {
            isNightOt = true;
        }
        // console.log("is night",isNightOt)
        if (isNightOt) {
            return graceMasterData.wo_max_night_ot_mins??120;
        } else {
            return graceMasterData.wo_max_day_ot_mins??120;
        }
    }
    
}
