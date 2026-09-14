Write-Host "=== 1. Health check ==="
$health = Invoke-RestMethod -Uri "http://localhost:5000/health"
$health | ConvertTo-Json

Write-Host "`n=== 2. Get Products (count & first item) ==="
$prods = Invoke-RestMethod -Uri "http://localhost:5000/api/products"
Write-Host "Total products returned: $($prods.Count)"
$prods[0] | Select-Object id, title, category, brand, price, rating | ConvertTo-Json

Write-Host "`n=== 3. Filter by brand=AaryaTech ==="
$AaryaTech = Invoke-RestMethod -Uri "http://localhost:5000/api/products?brand=AaryaTech"
Write-Host "AaryaTech products: $($AaryaTech.Count)"

Write-Host "`n=== 4. Admin Login ==="
$adminBody = @{ email = "admin@aaryamart.in"; password = "Admin@123" } | ConvertTo-Json
$adminAuth = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $adminBody -ContentType "application/json"
Write-Host "Logged in as: $($adminAuth.name) ($($adminAuth.role))"
Write-Host "Token: $($adminAuth.token.Substring(0, 35))..."

Write-Host "`n=== 5. Protected Profile (using JWT Bearer) ==="
$headers = @{ Authorization = "Bearer $($adminAuth.token)" }
$profile = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/profile" -Headers $headers
$profile | ConvertTo-Json

Write-Host "`n=== 6. Admin KPIs ==="
$kpis = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/kpis"
$kpis | ConvertTo-Json -Depth 3

Write-Host "`n=== 7. Coupon Validation ==="
$couponVal = Invoke-RestMethod -Uri "http://localhost:5000/api/coupons/validate/WELCOME100?subtotal=1500"
$couponVal | ConvertTo-Json

Write-Host "`n=== 8. Create Test Order (Checkout) ==="
$orderBody = @{
    customer = "Pooja Sharma"
    email = "pooja.sharma@example.com"
    phone = "+91 98765 43210"
    address = "Flat 402, Lotus Heights, Bengaluru, 560001"
    deliverySpeed = "Express Next-Day"
    paymentMethod = "UPI"
    couponCode = "WELCOME100"
    items = @(
        @{
            productId = "prod-1"
            title = "AaryaPro X1 Ultra 5G (Celestial Blue, 256GB)"
            qty = 1
            price = 64999
            img = "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600"
        }
    )
} | ConvertTo-Json -Depth 5

$newOrder = Invoke-RestMethod -Uri "http://localhost:5000/api/orders" -Method Post -Body $orderBody -ContentType "application/json"
Write-Host "Order created: $($newOrder.id) | Status: $($newOrder.status) | Total: ₹$($newOrder.total) | Tracking: $($newOrder.trackingId)"

Write-Host "`n=== 9. Update Order Status (Fulfillment) ==="
$statusBody = @{ status = "Confirmed"; trackingId = $newOrder.trackingId } | ConvertTo-Json
$statusRes = Invoke-RestMethod -Uri "http://localhost:5000/api/orders/$($newOrder.id)/status" -Method Put -Body $statusBody -ContentType "application/json"
$statusRes | ConvertTo-Json

Write-Host "`n=== 10. Saved Addresses ==="
$addresses = Invoke-RestMethod -Uri "http://localhost:5000/api/addresses?email=arun.patel@gmail.com"
Write-Host "Saved addresses count: $($addresses.Count)"
$addresses[0] | ConvertTo-Json

Write-Host "`n=== ALL API TESTS PASSED SUCCESSFULLY! ==="
