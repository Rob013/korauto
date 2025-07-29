-- Insert some sample inspection requests for testing
INSERT INTO public.inspection_requests (customer_name, customer_email, customer_phone, car_id, notes, status) VALUES
('John Doe', 'john.doe@example.com', '+355691234567', 'car-001', 'Car: 2020 BMW X5 - Request for full inspection', 'pending'),
('Maria Smith', 'maria.smith@example.com', '+355692345678', 'car-002', 'Car: 2019 Mercedes C-Class - Pre-purchase inspection needed', 'pending'),
('Robert Johnson', 'robert.j@example.com', '+355693456789', NULL, 'General inspection request', 'completed'),
('Elena Prifti', 'elena.p@example.com', '+355694567890', 'car-004', 'Car: 2021 Audi A4 - Insurance inspection required', 'in_progress'),
('Arben Krasniqi', 'arben.k@example.com', '+355695678901', 'car-005', 'Car: 2018 Toyota Camry - Routine inspection', 'pending');