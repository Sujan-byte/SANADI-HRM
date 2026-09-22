export class BonusModel {
    grade: number;
    grade_description: string;
    date: any;
    bonus_months: Date;
    bonus_details: Array<BonusDetails>
    grade_default_object: Record<string, any>;
    total: number
    total_bonus_amount: number;
}

export class BonusDetails {
    id?: number;
    employee: number;
    bonus_amount: number;
    bonus: number;
    management_incentive: number;
    variable_incentive: number;
    vehicle_maintenance_incentive: number;
    accidental_insurance_premium_share: number;
    health_insurance_premium_share: number;

}