export function generateAddress(data: any): string {
    console.log("data in generate address",data)
    let addressParts: string[] = [];

    if (data?.name) {
        addressParts.push(data.name);
    }
    if (data?.address) {
        addressParts.push(data.address);
    }
    // if (data?.address2) {
    //     addressParts.push(data.address2);
    // }
    if (data?.city) {
        let cityZip = data.city;
        if (data?.zip) {
            // console.log("Zip code")
            cityZip += ` - ${data.zip}`;
        }
        addressParts.push(cityZip);
    } else if (data?.zipCode) {
        addressParts.push(data.zipCode);
    }
    if (data?.state) {
        addressParts.push(data.state);
    }
    if (data?.country) {
        addressParts.push(data.country);
    }

    return addressParts.join('\n');
}
