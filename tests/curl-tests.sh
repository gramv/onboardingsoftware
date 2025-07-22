#!/bin/bash


BASE_URL="http://localhost:3001"
MANAGER_TOKEN="test-manager-token"
HR_TOKEN="test-hr-token"

echo "🧪 Testing QR-based Job Application System APIs"
echo "================================================"

echo "📝 Test 1: Submit Job Application"
curl -X POST "${BASE_URL}/api/jobs/test-job-id/apply" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john.doe@example.com",
    "phone": "555-0123",
    "address": {
      "street": "123 Main St",
      "city": "Anytown", 
      "state": "CA",
      "zipCode": "12345"
    },
    "experience": "Previous hotel experience",
    "education": "High school diploma"
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo "✅ Test 2: Manager Approve Application"
curl -X POST "${BASE_URL}/api/jobs/applications/test-app-id/approve" \
  -H "Authorization: Bearer ${MANAGER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": "Housekeeping duties including room cleaning and maintenance",
    "payRate": "$15.00/hour",
    "benefits": "Health insurance, PTO, employee discounts", 
    "startDate": "2025-08-01",
    "notes": "Excellent candidate with relevant experience"
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo "❌ Test 3: Manager Reject Application"
curl -X POST "${BASE_URL}/api/jobs/applications/test-app-id-2/reject" \
  -H "Authorization: Bearer ${MANAGER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Position has been filled"
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo "📋 Test 4: Get Applications for Manager Review"
curl -X GET "${BASE_URL}/api/jobs/applications" \
  -H "Authorization: Bearer ${MANAGER_TOKEN}" \
  -w "\nStatus: %{http_code}\n\n"

echo "✏️ Test 5: HR Request Changes to Onboarding Session"
curl -X POST "${BASE_URL}/api/onboarding/test-session-id/request-changes" \
  -H "Authorization: Bearer ${HR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "editRequests": [
      {
        "section": "i9_form",
        "field": "citizenshipStatus", 
        "reason": "Please verify citizenship documentation"
      },
      {
        "section": "personal_info",
        "field": "address",
        "reason": "Address format needs correction"
      }
    ],
    "managerEmail": "manager@example.com"
  }' \
  -w "\nStatus: %{http_code}\n\n"

echo "⏳ Test 6: HR Get Pending Sessions for Review"
curl -X GET "${BASE_URL}/api/onboarding/pending-review" \
  -H "Authorization: Bearer ${HR_TOKEN}" \
  -w "\nStatus: %{http_code}\n\n"

echo "✅ Test 7: HR Approve Onboarding Session"
curl -X POST "${BASE_URL}/api/onboarding/test-session-id/approve" \
  -H "Authorization: Bearer ${HR_TOKEN}" \
  -w "\nStatus: %{http_code}\n\n"

echo "🏁 All API tests completed!"
echo "Note: These tests expect the server to be running on ${BASE_URL}"
echo "Run 'npm run dev' in the server directory to start the backend"
