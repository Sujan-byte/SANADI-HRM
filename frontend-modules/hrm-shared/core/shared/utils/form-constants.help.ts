import { signal } from "@angular/core";


export enum ProductTypeEnum {
    machines = 'Machines',
    spares = 'Spares',
    services = 'Services',
}

export enum FreightEnum {
    paid = 'Paid',
    to_pay = 'To pay',
}

export const productTypeSignal = signal([
    {
        key: 'Service',
        value: 'Service'
    },
    {
        key: 'PI Without PO',
        value: 'PI Without PO',
    },
    {
        key: 'PGM Order',
        value: 'PGM Order',
    },
    {
        key: 'Mass Production',
        value: 'Mass Production',
    },
    {
        key: 'DXB-Machinery',
        value: 'DXB-Machinery',
    },
    {
        key: 'Machinery',
        value: 'Machinery',
    },
    {
        key: 'Project',
        value: 'Project',
    },
    {
        key: 'Mold',
        value: 'Mold',
    },
    {
        key: 'Sample-Mass',
        value: 'Sample-Mass',
    },
    {
        key: 'PGM Order',
        value: 'PGM Order',
    },
    {
        key: 'Sample-TD',
        value: 'Sample-TD',
    },
    {
        key: 'Forecast-Mass',
        value: 'Forecast-Mass',
    },
    {
        key: 'Forecast-TD',
        value: 'Forecast-TD',
    },
    {
        key: 'Patteh',
        value: 'Patteh',
    },
    {
        key: 'Patteh-Mass',
        value: 'Patteh-Mass',
    },
    {
        key: 'Patteh-TD',
        value: 'Patteh-TD',
    },
    {
        key: 'Sample',
        value: 'Sample',
    },
     {
        key: 'Freight Amendment',
        value: 'Freight Amendment',
    },
    {
        key: 'Price Amendment',
        value: 'Price Amendment',
    },
    {
        key: 'War Risk',
        value: 'War Risk',
    }
]);

export const productTypeListSignal = signal([
    {
        key: 'Forecast Sales Order',
        value: 'With Quotation'
    },
    {
        key: 'Confirmed Sales Order',
        value: 'Without Quotation',
    }
]);

export const CurrencyListSignal = signal([
    {
        key:'EUR',
        value:'EUR',
    },
    {
        key:'USD',
        value:'USD',
    },
    {
        key:'AED',
        value:'AED',
    },
    {
        key:'RMB',
        value:'RMB',
    },
    {
        key:'GBP',
        value:'GBP',
    },
    {
        key:'TL',
        value:'TL',
    },
    {
        key:'JPY',
        value:'JPY',
    },
])
export const floorStatusSignal = signal([
    {
        key:'Open',
        value:'Floor Open',
    },
    {
        key:'Close',
        value:'Floor Closed',
    },
])

export const otherChargesList = signal([
    {
        key:'PGM',
        value:'PGM',
    },
    {
        key:'AM',
        value:'AM',
    },
    {
        key:'Others',
        value:'Others',
    },
    {
        key:'Manually',
        value:'Manually',
    }
])


export const productTypeList = [
    {
        key: ProductTypeEnum.machines,
        value: ProductTypeEnum.machines,
    },
    {
        key: ProductTypeEnum.spares,
        value: ProductTypeEnum.spares,
    },
    {
        key: ProductTypeEnum.services,
        value: ProductTypeEnum.services,
    },
];

export const freightListSignal = signal([
    {
        key: FreightEnum.paid,
        value: FreightEnum.paid,
    },
    {
        key: FreightEnum.to_pay,
        value: FreightEnum.to_pay,
    },
]);

export enum ProductionTypeEnum {
    FABRICATION = 'Fabrication',
    ASSEMBLY = 'Assembly',
    PAINTING_PACKING = 'Painting & Packing',
}

export const productionTypeListSignal = signal([
    {
        key: ProductionTypeEnum.FABRICATION,
        value: ProductionTypeEnum.FABRICATION,
    },
    {
        key: ProductionTypeEnum.ASSEMBLY,
        value: ProductionTypeEnum.ASSEMBLY,
    },
    {
        key: ProductionTypeEnum.PAINTING_PACKING,
        value: ProductionTypeEnum.PAINTING_PACKING,
    },
]);
export const orderTypeSignal = signal([
    {
        key: 'Service',
        value: 'Service'
    },
    {
        key: 'PI Without PO',
        value: 'PI Without PO',
    },
    {
        key: 'PGM Order',
        value: 'PGM Order',
    },
    {
        key: 'Mass Production',
        value: 'Mass Production',
    },
    {
        key: 'DXB-Machinery',
        value: 'DXB-Machinery',
    },
    {
        key: 'Machinery',
        value: 'Machinery',
    },
    {
        key: 'Project',
        value: 'Project',
    },
    {
        key: 'Mold',
        value: 'Mold',
    },
    {
        key: 'Sample-Mass',
        value: 'Sample-Mass',
    },
    {
        key: 'PGM Order',
        value: 'PGM Order',
    },
    {
        key: 'Sample-TD',
        value: 'Sample-TD',
    },
    // {
    //     key: 'Forecast-Mass',
    //     value: 'Forecast-Mass',
    // },
    // {
    //     key: 'Forecast-TD',
    //     value: 'Forecast-TD',
    // },
    {
        key: 'Patteh',
        value: 'Patteh',
    },
    {
        key: 'Patteh-Mass',
        value: 'Patteh-Mass',
    },
    {
        key: 'Patteh-TD',
        value: 'Patteh-TD',
    },
    {
        key: 'Sample',
        value: 'Sample',
    },
    {
        key: 'Freight Amendment',
        value: 'Freight Amendment',
    },
    {
        key: 'Price Amendment',
        value: 'Price Amendment',
    },
    {
        key: 'War Risk',
        value: 'War Risk',
    }

]);

// INSPECTION 
export enum InspectionTypeEnum {
    INSPECTION = 'Inspection',
    REINSPECTION = 'Reinspection',
}

// ORDER TYPE
export enum OrderTypeEnum {
    PURCHASE_ORDER = 'Purchase Order',
    WORK_ORDER = 'Work Order',
    FIXED_ASSET = 'Fixed Asset',
    GENERAL_ORDER = 'General order',
    SALES_ORDER = 'Sales Order',
}