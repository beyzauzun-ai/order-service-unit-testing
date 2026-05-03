import pytest
from unittest.mock import MagicMock
from order_service import (
    Order, InventoryService, PaymentGateway,
    InvalidOrderError, InventoryShortageError, PaymentFailedError
)

@pytest.fixture
def mock_inventory():
    return MagicMock(spec=InventoryService)

@pytest.fixture
def mock_payment():
    return MagicMock(spec=PaymentGateway)

@pytest.fixture
def order(mock_inventory, mock_payment):
    return Order(
        inventory_service=mock_inventory,
        payment_gateway=mock_payment,
        customer_email="test@example.com"
    )

def test_checkout_empty_cart(order):
    with pytest.raises(InvalidOrderError, match="Cannot checkout an empty cart"):
        order.checkout()

def test_checkout_insufficient_stock(order, mock_inventory):
    order.add_item("item1", 10.0, 2)
    mock_inventory.get_stock.return_value = 1
    
    with pytest.raises(InventoryShortageError, match="Not enough stock for item1"):
        order.checkout()

def test_checkout_successful(order, mock_inventory, mock_payment):
    order.add_item("item1", 50.0, 2)  # Total 100
    mock_inventory.get_stock.return_value = 5
    mock_payment.charge.return_value = True
    
    result = order.checkout()
    
    assert result == {"status": "success", "charged_amount": 100.0}
    assert order.is_paid is True
    assert order.status == "COMPLETED"
    mock_inventory.get_stock.assert_called_once_with("item1")
    mock_payment.charge.assert_called_once_with(100.0, "USD")
    mock_inventory.decrement_stock.assert_called_once_with("item1", 2)

def test_checkout_payment_failure(order, mock_inventory, mock_payment):
    order.add_item("item1", 50.0, 2)
    mock_inventory.get_stock.return_value = 5
    mock_payment.charge.return_value = False
    
    with pytest.raises(PaymentFailedError, match="Transaction declined by gateway"):
        order.checkout()
        
    assert order.is_paid is False
    assert order.status == "DRAFT"
    mock_inventory.decrement_stock.assert_not_called()

def test_checkout_inventory_update(order, mock_inventory, mock_payment):
    order.add_item("item1", 20.0, 1)
    order.add_item("item2", 30.0, 2)
    
    # Mock stock availability
    def stock_side_effect(product_id):
        return 10  # Plentiful stock for all items
    mock_inventory.get_stock.side_effect = stock_side_effect
    mock_payment.charge.return_value = True
    
    order.checkout()
    
    # Check inventory is decremented for all items
    assert mock_inventory.decrement_stock.call_count == 2
    mock_inventory.decrement_stock.assert_any_call("item1", 1)
    mock_inventory.decrement_stock.assert_any_call("item2", 2)
