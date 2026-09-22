"""
Best-effort integration with a host's own `notifications` app, if it has one.

A host project is not required to have a `notifications` app to use this plugin -
core HRM functionality (creating a leave entry, a leave application, a TaDa request,
etc.) must still work without it, just without the extra in-app notification/approval
record that app would otherwise create. Unlike branch/security/tenant/customdblogger
(genuine hard dependencies this plugin's models/serializers import directly), nothing
here should ever raise ImportError into a host that hasn't installed notifications.
"""
import importlib
import logging

logger = logging.getLogger(__name__)


def send_optional_signal(module_path: str, signal_name: str, **send_kwargs):
    """Send a Django signal from a host's own notifications app, if present.
    Silently does nothing (beyond a debug log) if that app - or this particular
    signal in it - doesn't exist."""
    try:
        module = importlib.import_module(module_path)
        signal = getattr(module, signal_name)
    except (ImportError, AttributeError):
        logger.debug("Skipping optional %s.%s send - notifications app not available", module_path, signal_name)
        return
    signal.send(**send_kwargs)


def create_optional_approval_notification(**data):
    """Create a host's ApprovalNotificationERP record via its own serializer, if
    present. Returns the created instance, or None if the host has no notifications
    app (or no such serializer in it)."""
    try:
        from notifications.api.serializers import NotificationApprovalERPSerializer
    except ImportError:
        logger.debug("Skipping optional approval notification - notifications app not available")
        return None

    context = data.pop("context", None)
    serializer = NotificationApprovalERPSerializer(data=data, context=context)
    serializer.is_valid(raise_exception=True)
    return serializer.create(serializer.validated_data)
