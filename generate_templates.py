import openpyxl
import csv

headers = [
    "status", "file_no", "full_name", "father_mother_name", "dob", "gender", "contact_number", "blood_group", 
    "personal_email", "marital_status", "present_address", "permanent_address", "employee_id", "department", 
    "designation", "date_of_joining", "work_location", "reporting_manager", "pan_number", "aadhaar_number", 
    "other_id", "emergency_contact_name", "emergency_contact_relationship", "emergency_contact_number", 
    "father_husband_number", "mother_wife_number", "alternate_number", "account_holder_name", 
    "account_number", "bank_name", "ifsc_code", "branch", "documents_submitted", "education_qualification", 
    "year_of_passing", "institute", "previous_employment", "office_sim", "office_sim_date", 
    "laptop_system", "laptop_system_date", "official_email_crm", "official_email_crm_date", "signature_name"
]

# Generate XLSX
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "Bulk Import Template"
ws.append(headers)

# Add dummy data
dummy_data = ["Working", "F001", "JOHN DOE", "RICHARD DOE", "1990-05-15", "MALE", "9876543210", "O+", 
              "john.doe@example.com", "MARRIED", "123 STREET, BANGALORE", "SAME AS PRESENT", "EMP001", "ENGG", 
              "SOFTWARE ENGINEER", "2024-01-01", "CHENNAI", "JANE ROSE", "ABCDE1234F", "123456789012", 
              "", "SARAH DOE", "WIFE", "9123456789", "9876543210", "", "", "JOHN DOE", 
              "123456789", "HDFC BANK", "HDFC0001", "T.NAGAR", "{}", "B.TECH", 
              "2012", "IIT MADRAS", "[]", "YES", "2024-01-01", 
              "DELL LATITUDE", "2024-01-01", "john.crm@orbix.com", "2024-01-01", "JOHN DOE"]
ws.append(dummy_data)

wb.save("bulk_import_template.xlsx")

# Generate CSV
with open("bulk_import_template.csv", "w", newline='') as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    writer.writerow(dummy_data)

print("Templates generated successfully!")
