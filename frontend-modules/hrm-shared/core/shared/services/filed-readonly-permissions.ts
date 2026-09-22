interface TableData {
    key: string;
    model: Record<string, any>;
    childKeys: any;
}

export function updatePermissionChildTable(tableData: TableData[], key: string, parentInstance: Record<string, any>): Record<string, any> {
    const table = tableData?.find((ele) => ele?.key === key);
    if (table) {
        Object.keys(table?.model).forEach((childKey) => {
            if (table?.childKeys?.includes(childKey)) {
                table.model[childKey] = false;
            } else {
                table.model[childKey] = true;
            }
        });
        parentInstance[table?.key]?.push(table?.model);
    }
    return parentInstance;
}

export function updatePermissionsForRole(parentInstance: Record<string, any>, tableData: TableData[], parentKeys): Record<string, any> {
    Object.keys(parentInstance).forEach((key) => {
        const value = (parentInstance as any)[key];
        if (parentKeys.includes(key)) {
            (parentInstance as any)[key] = false;
        } else if (Array.isArray(value)) {
            parentInstance = updatePermissionChildTable(tableData, key, parentInstance);
        } else if (typeof value === 'object' && value !== null) {
            Object.keys(value).forEach((nestedKey) => {
                (value as any)[nestedKey] = false;
            });
        } else {
            (parentInstance as any)[key] = true;
        }
    });

    return parentInstance;
}
