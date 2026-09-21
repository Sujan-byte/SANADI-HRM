import base64
import os
from io import BytesIO

import barcode
import qrcode
from barcode.writer import ImageWriter


class CodeGeneratorService:
    # @TODO Need to store images in s3 bucket.

    @classmethod
    def generate_qr_code(cls,data):
        """
        Generate QR code image and return it as BytesIO buffer.

        Parameters:
        - data: The data to be encoded in the QR code.

        Returns:
        - BytesIO buffer containing the QR code image.
        """

        # Create a QR code instance
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)

        # Create an image object from the QR code instance
        img = qr.make_image(fill_color="black", back_color="white")

        # Save the image directly to base64
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        encoded_image = base64.b64encode(buffer.getvalue()).decode('utf-8')
        # Add PNG base64 prefix
        encoded_image_with_prefix = f"data:image/png;base64,{encoded_image}"

        # Return the base64-encoded representation of the QR code image
        return encoded_image_with_prefix

    @classmethod
    def generate_barcode(cls,product_identifier):
        """
        Generate barcode image and return it as BytesIO buffer.
        Parameters:
        - product_identifier: The data to be encoded in the barcode.
        Returns:
        - BytesIO buffer containing the barcode image.
        """
        # Calculate the checksum
        # checksum = cls.calculate_checksum(product_identifier)
        # {checksum}
        # Concatenate the data and checksum
        # Get the Code128 barcode class
        Code128 = barcode.get_barcode_class('code128')
        # Create an instance of the Code128 barcode with the product identifier
        ean = Code128(f'{product_identifier}', writer=ImageWriter())

        # Save the barcode image directly to base64
        buffer = BytesIO()
        ean.write(buffer)
        encoded_image = base64.b64encode(buffer.getvalue()).decode('utf-8')
        # Add PNG base64 prefix
        encoded_image_with_prefix = f"data:image/png;base64,{encoded_image}"
        # Return the base64-encoded representation of the barcode image
        return encoded_image_with_prefix

    @classmethod
    def calculate_checksum(cls, data):
        """
        Calculate the checksum for a 12-digit numeric data using the Modulus 10 algorithm.

        Parameters:
        - data (str): A 12-digit numeric string for which the checksum is calculated.

        Returns:
        - str: The calculated checksum digit.

        Raises:
        - ValueError: If the provided data is not a valid 12-digit numeric string.
        """
        # Check if the data is a 12-digit number
        print("data",len(data))
        if len(data) != 12:
            print("come here")
            raise ValueError("Invalid data format for checksum calculation")

        # Multiply alternating digits by 1 or 3 and sum them up
        total = sum(int(digit) * (3 if index % 2 == 0 else 1) for index, digit in enumerate(data))

        # Calculate the checksum as the difference from the next multiple of 10
        checksum = (10 - (total % 10)) % 10

        return str(checksum)
