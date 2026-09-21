from rest_framework.exceptions import APIException
from rest_framework import status
from hrm_utils.exceptions.utils import extract_debug_info

class AssetManagementSystemException(APIException):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_detail = 'Unknown System Exception Occurred. Please contact the system administrator.'
    traceback_info = {}

    def __init__(self, detail=None, status_code=None, traceback_info=None):
        if detail:  # Use this to send message to client informing something went wrong
            self.detail = detail
        if status_code:  # use this to send client side status code
            self.status_code = status_code
        if traceback_info:  # use this to log this error in the logging system
            self.traceback_info = traceback_info
            # try:
            #     _info = extract_debug_info(traceback_info)
            # except Exception as err:
            #     _info = traceback_info
            # self.traceback_info = _info

    def get_system_error_details(self):
        try:
            _info = extract_debug_info(self.traceback_info)
        except Exception as err:
            _info = self.traceback_info
        details = {
            "detail": self.detail,
            "status_code": self.status_code,
            "traceback_info": _info
        }
        # TODO: add logging.error here to log the error in the logging system
        return details

    def get_client_error_details(self):
        return {
            "request_status": False,
            "detail": self.detail,
            "error_info": self.traceback_info
        }
