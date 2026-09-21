import re


def extract_debug_info(error_message):
    error_info = {
        "error_type": None,
        "constraint": None,
        "detail": None,
        "location": None
    }

    # Extracting error type
    error_type_match = re.search(r"(django\.db\.utils\.\w+Error):", error_message)
    if error_type_match:
        error_info["error_type"] = error_type_match.group(1)

    # Extracting constraint
    constraint_match = re.search(r"constraint \"(\w+)\"", error_message)
    if constraint_match:
        error_info["constraint"] = constraint_match.group(1)

    # Extracting detail
    detail_match = re.search(r"DETAIL: (.+)", error_message)
    if detail_match:
        error_info["detail"] = detail_match.group(1)

    # Extracting location
    location_match = re.search(r"File \"([^\"]+)\", line (\d+), in", error_message)
    if location_match:
        error_info["location"] = f"{location_match.group(1)}: Line {location_match.group(2)}"

    return error_info

def format_missing_fields(error_dict):
    data = {}
    for key, value in error_dict.items():
        if isinstance(value, dict):
            data[key] = format_missing_fields(value)
        else:
            data[key] = value[0]
    return data

def api_exception_handler(detail, status_code, error_info, source="client", *args, **kwargs):
    # the import below is done here to avoid circular import in exceptions.base
    from hrm_utils.exceptions.base import AssetManagementSystemException
    if kwargs.get("serializer_err"):
        error_info = format_missing_fields(error_info)
    if source == "client":
        return AssetManagementSystemException(
            detail=detail,
            status_code=status_code,
            traceback_info=error_info).get_client_error_details()
    return AssetManagementSystemException(
        detail=detail,
        status_code=status_code,
        traceback_info=error_info).get_system_error_details()

