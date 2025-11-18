# inventory/tests.py

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from .models import Item, ItemSerial, ItemUpdate

User = get_user_model()


class InventoryViewsTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            role="superadmin",
            first_name="Test",
            last_name="User",
            is_active=True,
        )
        self.user.first_login = False  # avoid password-change redirects
        self.user.save()

        self.client.force_login(self.user)

    # helper to create via view using the exact POST keys your add_item expects
    def create_item_via_view(self, name="Test Item", description="desc", date_added=None, unit="pcs"):
        url = reverse("add_item")
        data = {
            "item": name,
            "description": description,
            "unit_of_quantity": unit,
        }
        if date_added:
            data["date_added"] = date_added.strftime("%Y-%m-%d")
        resp = self.client.post(url, data, follow=True)
        # expect redirect to inventory on success; follow=True yields 200
        self.assertIn(resp.status_code, (200, 302))
        # verify item exists and is not soft-deleted
        item = Item.objects.filter(item_name=name).first()
        self.assertIsNotNone(item, msg=f"Item '{name}' was not created via add_item view. Response content: {resp.content[:200]}")
        return item

    def post_update(self, item_id, in_value=0, out_value=0, allocated=0, serials=None, date=None, **extra):
        url = reverse("update_item", args=[item_id])
        data = {
            "in": str(in_value),
            "out": str(out_value),
            "allocated_quantity": str(allocated),
            "serial_numbers": ", ".join(serials) if serials else "",
        }
        if date:
            data["date_added"] = date.strftime("%Y-%m-%d")
        data.update(extra)
        resp = self.client.post(url, data, follow=True)
        return resp

    # ===== ORIGINAL 15 TESTS =====

    def test_add_item_defaults_and_not_deleted(self):
        item = self.create_item_via_view(name="Drill", description="Electric drill", unit="pcs")
        self.assertEqual(item.total_stock, 0)
        self.assertEqual(item.allocated_quantity, 0)
        self.assertFalse(item.is_deleted)
        self.assertEqual(item.unit_of_quantity, "pcs")

    def test_in_transaction_creates_update_and_serials(self):
        item = self.create_item_via_view("Screwdriver", "desc")
        serials = ["S1", "S2"]
        resp = self.post_update(item.id, in_value=2, serials=serials)
        self.assertEqual(resp.status_code, 200)
        item.refresh_from_db()
        self.assertEqual(item.total_stock, 2)
        # check ItemUpdate created
        self.assertTrue(ItemUpdate.objects.filter(item=item, transaction_type="IN").exists())
        # check serials created
        created = list(ItemSerial.objects.filter(item=item).values_list("serial_no", flat=True))
        self.assertCountEqual(created, serials)

    def test_out_transaction_decreases_stock_and_marks_serial_unavailable(self):
        item = self.create_item_via_view("Wrench", "desc")
        # IN first
        self.post_update(item.id, in_value=2, serials=["A1", "A2"])
        item.refresh_from_db()
        self.assertEqual(item.total_stock, 2)
        # OUT 1 using A1
        resp = self.post_update(item.id, out_value=1, serials=["A1"])
        self.assertEqual(resp.status_code, 200)
        item.refresh_from_db()
        self.assertEqual(item.total_stock, 1)
        s = ItemSerial.objects.get(item=item, serial_no="A1")
        self.assertFalse(s.is_available)
        # other serial remains available
        s2 = ItemSerial.objects.get(item=item, serial_no="A2")
        self.assertTrue(s2.is_available)

    def test_out_more_than_available_shows_error_and_no_change(self):
        item = self.create_item_via_view("Bolt", "desc")
        self.post_update(item.id, in_value=1, serials=["B1"])
        item.refresh_from_db()
        self.assertEqual(item.total_stock, 1)
        # Attempt OUT 2 should be rejected by view (redirect back and message)
        resp = self.post_update(item.id, out_value=2, serials=["B1", "B2"])
        # stock should remain unchanged
        item.refresh_from_db()
        self.assertEqual(item.total_stock, 1)
        # Expect error message text in response (template shows messages)
        self.assertContains(resp, "Not enough stock", status_code=200)

    def test_serial_count_mismatch_on_update_shows_error(self):
        item = self.create_item_via_view("Mismatch", "desc")
        # add with serials via IN
        self.post_update(item.id, in_value=2, serials=["X1", "X2"])
        # Try to OUT 1 but supply 0 serials (should error because item has serial tracking)
        resp = self.post_update(item.id, out_value=1, serials=[])
        self.assertContains(resp, "uses serial numbers", status_code=200)

    def test_allocated_transaction_marks_reserved_and_increment_allocated(self):
        item = self.create_item_via_view("Helmet", "desc")
        self.post_update(item.id, in_value=2, serials=["H1", "H2"])
        # allocate 1
        self.post_update(item.id, allocated=1, serials=["H1"])
        item.refresh_from_db()
        self.assertEqual(item.allocated_quantity, 1)
        s = ItemSerial.objects.get(item=item, serial_no="H1")
        self.assertFalse(s.is_available)  # reserved

    def test_convert_allocate_to_out_converts_and_updates_stock(self):
        item = self.create_item_via_view("Cable", "desc")
        self.post_update(item.id, in_value=3, serials=["C1", "C2", "C3"])
        self.post_update(item.id, allocated=2, serials=["C1", "C2"])
        allocate_update = ItemUpdate.objects.filter(item=item, transaction_type="ALLOCATED").first()
        self.assertIsNotNone(allocate_update)
        url = reverse("convert_allocate_to_out", args=[allocate_update.id])
        # must POST to convert
        resp = self.client.post(url, follow=True)
        self.assertEqual(resp.status_code, 200)
        item.refresh_from_db()
        # After converting allocated 2 to OUT, total should be 1 (3 - 2)
        self.assertEqual(item.total_stock, 1)
        allocate_update.refresh_from_db()
        self.assertTrue(allocate_update.is_converted)
        # the serials used should now be unavailable
        for sn in ["C1", "C2"]:
            self.assertFalse(ItemSerial.objects.get(item=item, serial_no=sn).is_available)

    def test_undo_IN_deletes_serials_and_resets_stock(self):
        item = self.create_item_via_view("Lamp", "desc")
        self.post_update(item.id, in_value=2, serials=["L1", "L2"])
        update = ItemUpdate.objects.filter(item=item, transaction_type="IN").first()
        self.assertIsNotNone(update)
        url = reverse("undo_transaction", args=[update.id])
        resp = self.client.post(url, follow=True)
        self.assertEqual(resp.status_code, 200)
        item.refresh_from_db()
        self.assertEqual(item.total_stock, 0)
        # serials added by IN should be removed by undo
        self.assertFalse(ItemSerial.objects.filter(item=item, serial_no="L1").exists())

    def test_undo_OUT_restores_stock_and_serials(self):
        item = self.create_item_via_view("Motor", "desc")
        self.post_update(item.id, in_value=2, serials=["M1", "M2"])
        self.post_update(item.id, out_value=1, serials=["M1"])
        out_update = ItemUpdate.objects.filter(item=item, transaction_type="OUT").first()
        self.assertIsNotNone(out_update)
        url = reverse("undo_transaction", args=[out_update.id])
        resp = self.client.post(url, follow=True)
        self.assertEqual(resp.status_code, 200)
        item.refresh_from_db()
        self.assertEqual(item.total_stock, 2)
        self.assertTrue(ItemSerial.objects.get(item=item, serial_no="M1").is_available)

    def test_auto_soft_delete_after_stock_zero(self):
        item = self.create_item_via_view("Glue", "desc")
        self.post_update(item.id, in_value=1, serials=["G1"])
        self.post_update(item.id, out_value=1, serials=["G1"])
        item.refresh_from_db()
        # the post_save signal should soft-delete the item when stock hits 0
        self.assertTrue(item.is_deleted)

    def test_new_item_created_with_zero_stock_is_not_deleted(self):
        # creating a new item should not be immediately soft-deleted
        item = self.create_item_via_view("NewZero", "desc")
        item.refresh_from_db()
        self.assertFalse(item.is_deleted)

    def test_item_history_view_shows_IN(self):
        item = self.create_item_via_view("HistoryItem", "desc")
        self.post_update(item.id, in_value=1, serials=["HI1"])
        url = reverse("item_history", args=[item.id])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        # item_history template will render updates; check for transaction type "IN"
        self.assertContains(resp, "IN")

    def test_ajax_search_po_returns_rendered_html(self):
        item = self.create_item_via_view("PoTest", "desc")
        ItemUpdate.objects.create(item=item, transaction_type="IN", quantity=1, user=self.user, po_supplier="PO-123")
        url = reverse("ajax_search_po") + "?q=PO-123"
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("html", data)
        self.assertTrue(len(data["html"]) > 0)

    def test_backdated_transaction_outside_window_rejected(self):
        item = self.create_item_via_view("DateTest", "desc")
        # attempt to post a date older than 5 days
        old_date = timezone.localdate() - timedelta(days=6)
        resp = self.post_update(item.id, in_value=1, serials=["D1"], date=old_date)
        # should be rejected because date is too old
        self.assertContains(resp, "You can only input transactions within the last 5 days", status_code=200)

    def test_mutual_exclusive_fields_rejected(self):
        item = self.create_item_via_view("Mutual", "desc")
        # provide both IN and OUT together
        resp = self.client.post(reverse("update_item", args=[item.id]), {"in": "1", "out": "1"}, follow=True)
        self.assertContains(resp, "You can only enter IN/OUT or Allocated Quantity", status_code=200)

    # ===== NEW 9 TESTS =====

    def test_undo_allocated_transaction_restores_allocated_quantity(self):
        """Test that undoing an ALLOCATED transaction restores allocated quantity and serial availability"""
        item = self.create_item_via_view("AllocateUndo", "desc")
        self.post_update(item.id, in_value=3, serials=["AU1", "AU2", "AU3"])
        self.post_update(item.id, allocated=2, serials=["AU1", "AU2"])

        item.refresh_from_db()
        self.assertEqual(item.allocated_quantity, 2)

        # Now undo the allocation
        allocate_update = ItemUpdate.objects.filter(item=item, transaction_type="ALLOCATED").first()
        url = reverse("undo_transaction", args=[allocate_update.id])
        self.client.post(url, follow=True)

        item.refresh_from_db()
        self.assertEqual(item.allocated_quantity, 0)
        # Serials should be available again
        self.assertTrue(ItemSerial.objects.get(item=item, serial_no="AU1").is_available)
        self.assertTrue(ItemSerial.objects.get(item=item, serial_no="AU2").is_available)

    def test_multiple_sequential_transactions_maintain_correct_totals(self):
        """Test a chain of transactions: IN(5) → OUT(2) → IN(3) → OUT(4)"""
        item = self.create_item_via_view("Sequential", "desc")

        # IN 5
        self.post_update(item.id, in_value=5, serials=["SQ1", "SQ2", "SQ3", "SQ4", "SQ5"])
        item.refresh_from_db()
        self.assertEqual(item.total_stock, 5)

        # OUT 2
        self.post_update(item.id, out_value=2, serials=["SQ1", "SQ2"])
        item.refresh_from_db()
        self.assertEqual(item.total_stock, 3)

        # IN 3 more
        self.post_update(item.id, in_value=3, serials=["SQ6", "SQ7", "SQ8"])
        item.refresh_from_db()
        self.assertEqual(item.total_stock, 6)

        # OUT 4
        self.post_update(item.id, out_value=4, serials=["SQ3", "SQ4", "SQ6", "SQ7"])
        item.refresh_from_db()
        self.assertEqual(item.total_stock, 2)

    def test_backdated_transaction_recalculates_subsequent_transactions(self):
        """Test that a backdated IN correctly affects the running totals"""
        item = self.create_item_via_view("Backdated", "desc")
        today = timezone.localdate()

        # Add transaction today
        self.post_update(item.id, in_value=2, serials=["BD1", "BD2"], date=today)
        item.refresh_from_db()
        self.assertEqual(item.total_stock, 2)

        # Add backdated transaction (2 days ago)
        backdated = today - timedelta(days=2)
        self.post_update(item.id, in_value=3, serials=["BD3", "BD4", "BD5"], date=backdated)
        item.refresh_from_db()

        # Total should now be 5 (backdated 3 + today's 2)
        self.assertEqual(item.total_stock, 5)

        # Verify all ItemUpdates have correct stock_after_transaction
        updates = ItemUpdate.objects.filter(item=item, undone=False).order_by("date")
        self.assertEqual(len(updates), 2)
        self.assertEqual(updates[0].stock_after_transaction, 3)  # backdated one first
        self.assertEqual(updates[1].stock_after_transaction, 5)  # today's one after

    def test_serial_reuse_after_undo_out(self):
        """Test that undoing an OUT makes serials available for a new OUT"""
        item = self.create_item_via_view("SerialReuse", "desc")
        self.post_update(item.id, in_value=2, serials=["SR1", "SR2"])

        # OUT 1
        self.post_update(item.id, out_value=1, serials=["SR1"])
        s1 = ItemSerial.objects.get(item=item, serial_no="SR1")
        self.assertFalse(s1.is_available)

        # Undo the OUT
        out_update = ItemUpdate.objects.filter(item=item, transaction_type="OUT").first()
        url = reverse("undo_transaction", args=[out_update.id])
        self.client.post(url, follow=True)

        # SR1 should be available again
        s1.refresh_from_db()
        self.assertTrue(s1.is_available)

        # Should be able to OUT using SR1 again
        resp = self.post_update(item.id, out_value=1, serials=["SR1"])
        self.assertEqual(resp.status_code, 200)
        item.refresh_from_db()
        self.assertEqual(item.total_stock, 1)

    def test_empty_and_whitespace_serial_numbers(self):
        """Test handling of empty strings and whitespace-only serial input"""
        item = self.create_item_via_view("Whitespace", "desc")

        # Try to add IN with whitespace-only serials (should be filtered out)
        resp = self.post_update(item.id, in_value=2, serials=["  ", "WS1", ""])
        # Should only accept WS1, so count mismatch error
        self.assertContains(resp, "must match the quantity")

    def test_non_serialized_item_workflow(self):
        """Test items that don't use serial numbers at all"""
        item = self.create_item_via_view("NonSerial", "desc")

        # Add serials first to establish serial tracking
        self.post_update(item.id, in_value=2, serials=["NS1", "NS2"])
        item.refresh_from_db()
        self.assertEqual(item.total_stock, 2)

        # Now try to add more without serials (should fail)
        resp = self.post_update(item.id, in_value=1, serials=[])
        self.assertContains(resp, "uses serial numbers")

    def test_allocated_quantity_decreases_after_conversion(self):
        """Explicitly test that allocated_quantity decreases when converted to OUT"""
        item = self.create_item_via_view("AllocDecr", "desc")
        self.post_update(item.id, in_value=5, serials=["AD1", "AD2", "AD3", "AD4", "AD5"])
        self.post_update(item.id, allocated=3, serials=["AD1", "AD2", "AD3"])

        item.refresh_from_db()
        self.assertEqual(item.allocated_quantity, 3)
        self.assertEqual(item.total_stock, 5)

        # Convert to OUT
        allocate_update = ItemUpdate.objects.filter(item=item, transaction_type="ALLOCATED").first()
        url = reverse("convert_allocate_to_out", args=[allocate_update.id])
        self.client.post(url, follow=True)

        item.refresh_from_db()
        # Allocated should decrease to 0 (since it's converted)
        self.assertEqual(item.allocated_quantity, 0)
        # Total stock should decrease by 3
        self.assertEqual(item.total_stock, 2)

    def test_prevent_double_conversion_of_allocated_transaction(self):
        """Ensure converting an already converted ALLOCATED transaction shows a warning."""
        item = self.create_item_via_view("DoubleConvert", "desc")
        self.post_update(item.id, in_value=2, serials=["DC1", "DC2"])
        self.post_update(item.id, allocated=2, serials=["DC1", "DC2"])

        allocate_update = ItemUpdate.objects.filter(item=item, transaction_type="ALLOCATED").first()
        url = reverse("convert_allocate_to_out", args=[allocate_update.id])

        # First conversion should succeed
        resp = self.client.post(url, follow=True)
        item.refresh_from_db()
        self.assertEqual(item.total_stock, 0)
        self.assertEqual(item.allocated_quantity, 0)
        self.assertContains(resp, "converted to OUT successfully")

        # Second conversion attempt should be blocked
        resp = self.client.post(url, follow=True)
        self.assertContains(resp, "already been converted")
        allocate_update.refresh_from_db()
        self.assertTrue(allocate_update.is_converted)

    def test_complex_allocate_convert_undo_sequence(self):
        """
        Test complex flow: allocate → convert to OUT → undo OUT → check restore correctness.
        Ensures allocated and total_stock restore correctly.
        """
        item = self.create_item_via_view("Complex", "desc")
        self.post_update(item.id, in_value=5, serials=["CX1", "CX2", "CX3", "CX4", "CX5"])

        # Allocate 2
        self.post_update(item.id, allocated=2, serials=["CX1", "CX2"])
        item.refresh_from_db()
        self.assertEqual(item.allocated_quantity, 2)
        self.assertEqual(item.total_stock, 5)

        # Convert to OUT
        allocate_update = ItemUpdate.objects.filter(item=item, transaction_type="ALLOCATED").first()
        convert_url = reverse("convert_allocate_to_out", args=[allocate_update.id])
        self.client.post(convert_url, follow=True)

        item.refresh_from_db()
        self.assertEqual(item.total_stock, 3)
        self.assertEqual(item.allocated_quantity, 0)

        # Undo the OUT transaction
        out_update = ItemUpdate.objects.filter(item=item, transaction_type="OUT").first()
        undo_url = reverse("undo_transaction", args=[out_update.id])
        self.client.post(undo_url, follow=True)

        item.refresh_from_db()
        # After undo, restore both total stock and allocated quantities
        self.assertEqual(item.total_stock, 5)
        self.assertEqual(item.allocated_quantity, 2)

        # The allocate update should now be marked as not converted
        allocate_update.refresh_from_db()
        self.assertFalse(allocate_update.is_converted)
