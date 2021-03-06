//Init FC
var FC = FC || {};
//console.log("LOADED");

//FC Function to Init
FC.client.wrap("rejoinerInit", function () {
	//console.log("INIT");

	//Was email set on page load? If so, we should pass it in
	if (jQuery("#customer_email").val()) {
		_rejoiner._fc_email_set = true;
	} else {
		_rejoiner._fc_email_set = false;
	}

	//If this is the checkout, let's send the cart data
	if (FC.json.context == "checkout") {
		FC.client.event("rejoinerCartData").trigger();
		FC.client.event("rejoinerItemData").trigger();
	}

	//If this is the first receipt display, let's send conversion details
	if (FC.json.context == "receipt" && FC.json.first_receipt_display) {
		_rejoiner.push(['sendConversion']);
	}
});

//FC Function to set Rejoiner Cart Data
FC.client.wrap("rejoinerCartData", function () {

	//console.log("SETTING CART DATA");

	//Check Coupon
	if (!jQuery.isEmptyObject(FC.json.coupons)) {
		jQuery.each(FC.json.coupons, function(i, coupon){
			coupon_code = i;
		});
	} else {
		coupon_code = "";
	}

	//Build Params
	rejoiner_params = {
		'value': FC.json.total_item_price,
		'totalItems': FC.json.item_count,
		'customer_order_number': FC.json.transaction_id,
		'promo': coupon_code,
		'returnUrl': 'https://' + FC.json.config.store_domain + '/checkout?fcsid=' + FC.json.session_id
	};

	//If We Need to Do an Initial Email Set
	if (_rejoiner._fc_email_set) {
		rejoiner_params.email = jQuery("#customer_email").val();
		rejoiner_email_set = true;
	}

	//Send to Rejoiner
	_rejoiner.push(['setCartData', rejoiner_params]);
});

//FC Function to Send Cart Items
FC.client.wrap("rejoinerItemData", function () {
	//console.log("SETTING ITEM DATA");
	for (i = 0; i < FC.json.items.length; i++) {
		_rejoiner.push(['setCartItem', {
			'name': FC.json.items[i].name,
			'product_id': FC.json.items[i].code,
			'price': FC.json.items[i].price_each,
			'product_url': FC.json.items[i].url,
			'category': FC.json.items[i].category,
			'item_qty': FC.json.items[i].quantity,
			'qty_price': FC.json.items[i].price,
			'image_url': FC.json.items[i].image
		}]);
	}
});

//FC not yet loaded, bind to ready.done
if (typeof FC.settings == "undefined") {
	FC.client.on('ready.done', function(){
		FC.client.event("rejoinerInit").trigger();
	});

//ready.done has already run, so init immediately
} else {
	FC.client.event("rejoinerInit").trigger();
}

//When the cart is updated on the checkout, clear the cart details and re-send everything
FC.client.on('cart-item-quantity-update.done', function(){
	//console.log("CART QUANTITY UPDATE DONE");
	_rejoiner.push(['clearCartData']);
	FC.client.event("rejoinerCartData").trigger();
	FC.client.event("rejoinerItemData").trigger();
});

//When the cart is updated on the checkout, clear the cart details and re-send everything
FC.client.on('cart-item-remove.done', function(){
	//console.log("CART REMOVE UPDATE DONE");
	_rejoiner.push(['clearCartData']);
	FC.client.event("rejoinerCartData").trigger();
	FC.client.event("rejoinerItemData").trigger();
});

//When an item is added to the cart on the checkout, clear the cart details and re-send everything
FC.client.on('cart-submit.done', function(){
	//console.log("CART ADD UPDATE DONE");
	_rejoiner.push(['clearCartData']);
	FC.client.event("rejoinerCartData").trigger();
	FC.client.event("rejoinerItemData").trigger();
});

//When the customer email is updated, send an update to Rejoiner
FC.client.on('customer-email-update.done', function(){
	//console.log("CUSTOMER EMAIL DONE");
	//Only do this if we had set the email on the initial page load, otherwise the regular blur event should cover it
	if (_rejoiner._fc_email_set) {
		FC.client.event("rejoinerCartData").trigger();
	}
});

//When a coupon is added, send an update to Rejoiner
FC.client.on('cart-coupon-add.done', function(){
	//console.log("COUPON ADDED");
	FC.client.event("rejoinerCartData").trigger();
});

//When a coupon is removed, send an update to Rejoiner
FC.client.on('cart-coupon-remove.done', function(){
	//console.log("COUPON REMOVED");
	FC.client.event("rejoinerCartData").trigger();
});
