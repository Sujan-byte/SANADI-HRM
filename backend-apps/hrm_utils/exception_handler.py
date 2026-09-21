"""
Generic exception handler for the backend.
this is helpful for extended handling of the exceptions and return user-friendly messages
and appropriate data for logging and debugging purposes.
"""
import traceback

from hrm_utils.exceptions.utils import api_exception_handler
from rest_framework.response import Response
from rest_framework import status


class ApiException(Exception):
    def __init__(self, status_code, error_info):
        self.status_code = status_code
        self.error_info = error_info

    # def to_representation(self, instance):
    #     return self.data


class ExceptionsHandler:
    def __init__(self):
        pass

    def handle_serializer_errors(self, serializer, error_detail, status_code=status.HTTP_400_BAD_REQUEST):
        if not serializer.is_valid():
            error_obj = api_exception_handler(
                detail=error_detail,
                status_code=status_code,
                error_info=serializer.errors,
                source="client",
                **{"serializer_err": True}
            )
            raise ApiException(
                status_code=status_code,
                error_info=error_obj
            )

    def handle_unknown_error(self, request, err, status_code=status.HTTP_400_BAD_REQUEST):
        error_obj = api_exception_handler(
            detail="Unknown System error",
            status_code=status_code,
            error_info={
                "error": str(err),
                "debug_info": traceback.format_exc(),
                "request_data": request.data
            },
            source="server"
        )
        raise ApiException(
            status_code=status_code,
            error_info=error_obj
        )
    def handle_known_error(self, request, error_detail, error_info, status_code):
        err_data = api_exception_handler(
            detail=error_detail,
            status_code=status_code,
            error_info={
                "error": error_info,
                "debug_info": traceback.format_exc(),
                "request_data": request.data
            },
            source="server"
        )
        raise ApiException(
            status_code=status_code,
            error_info=err_data
        )
