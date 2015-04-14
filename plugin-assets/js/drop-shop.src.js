jQuery( document ).ready( function( $ ) { 
	'use strict';

	// declared namespace to prevent conflict
	$.woocommerce_drop_shop_scripts = {
		
		init: function() {
			var autoHideTimer,
				mainContainer = $( '.woocommerce-drop-shop-wrapper' ),
				settings = $.parseJSON( $( '.woocommerce-drop-shop-settings', mainContainer ).val() );

			function setAutoHide() {
				if ( parseInt( settings.autohide, 10 ) > 0 ) {	

					var time = parseInt( settings.autohide, 10 ) * 1000;

					// first clear the timer
					window.clearTimeout( autoHideTimer );						
				
					// set the timer for the cart and slide back when expired
					autoHideTimer = window.setTimeout( function() { mainContainer.removeClass( 'show' ).addClass( 'hide' ); }, time );	
				}
			}

			setAutoHide();

			function clearAutoHide() {
				// if autohide is on
				if ( parseInt( settings.autohide, 10 ) > 0 ) {				
					window.clearTimeout( autoHideTimer );
				}
			}

			// toggle horizontal position cart open close
			$( '.woocommerce-drop-shop-tab', mainContainer ).click( function() {
				// check current position
				if ( parseInt( mainContainer.css( 'bottom' ), 10 ) === 0 ) {		
					mainContainer.removeClass( 'show' ).addClass( 'hide' );
					
					// clear the timer when closed
					clearAutoHide();					
				} else {
					mainContainer.removeClass( 'hide' ).addClass( 'show' );

					setAutoHide();
				}
			});

			function runCarousel() {
				// grab saved settings
				var visible = parseInt( settings.visible, 10 ),
					speed = parseInt( settings.speed, 10 ),
					scrollBy = parseInt( settings.scrollby, 10 );
					
				// set a default if not set
				if ( visible.length === 0 ) {
					visible = 3;
				}
				
				// set a default if not set
				if ( speed.length === 0 ) {
					speed = 400;
				}
				
				// set a default if not set
				if ( scrollBy.length === 0 ) {
					scrollBy = 1;
				}

				if ( $( '.woocommerce-cart ul' ).length ) {
					// ensure images are loaded before initializing carousel to prevent height issues
					imagesLoaded( '.woocommerce-cart ul', function() {
						$( '.woocommerce-cart ul', mainContainer ).carouFredSel({
							items: { 
								visible: visible,
							},
							circular: false,
							infinite: false,
							responsive: false,
							direction: 'left',
							align: 'center',
							swipe: {
								onTouch: true
							},
							//width: '100%', // 100% crashes browser when ajaxed and resized
							scroll: {
								items: scrollBy,
								duration: speed,
								easing: settings.easing,
								onAfter: function() {
									if ( $( '.woocommerce-drop-shop-prev', mainContainer ).hasClass( 'disabled' ) ) {
										$( '.woocommerce-drop-shop-prev', mainContainer ).stop( true, true ).fadeOut( 'fast' );
									} else {
										$( '.woocommerce-drop-shop-prev', mainContainer ).stop( true, true ).fadeIn( 'fast' );
									}

									if ( $( '.woocommerce-drop-shop-next', mainContainer ).hasClass( 'disabled' ) ) {
										$( '.woocommerce-drop-shop-next', mainContainer ).stop( true, true ).fadeOut( 'fast' );
									} else {
										$( '.woocommerce-drop-shop-next', mainContainer ).stop( true, true ).fadeIn( 'fast' );
									}
								}
							},
							next: {
								button: $( '.woocommerce-drop-shop-next', mainContainer )
							},
							prev: {
								button: $( '.woocommerce-drop-shop-prev', mainContainer )
							},
							auto: {
								play: false
							},
							onCreate: function() { 
								var currentVisibleItems,
									totalWidth = 0;

								// check how many items are currently visible 
								$( '.woocommerce-cart ul', mainContainer ).trigger( 'currentVisible', function( items ) {
									currentVisibleItems = items.length; 
								});

								// multiply total width of an item by currently visible items						
								totalWidth = currentVisibleItems * $( '.caroufredsel_wrapper li', mainContainer ).outerWidth( true );

								// set the carousel width dynamically
								$( '.caroufredsel_wrapper', mainContainer ).width( totalWidth );
								
								// set dropshop to be visible after create to prevent FOUC
								$( '.woocommerce-cart', mainContainer ).css( 'visibility', 'visible' );

								// set the carousel to be inline-block so it can self-center
								$( '.caroufredsel_wrapper', mainContainer ).css( 'margin', '0' ).css( 'display', 'inline-block' );
							}
						});
					});
				}
			}

			runCarousel();

			function find_matching_variations( product_variations, settings ) {
				var matching = [];

				for ( var i = 0; i < product_variations.length; i++ ) {
					var variation = product_variations[i];

					if ( variations_match( variation.attributes, settings ) ) {
						matching.push( variation );
					}
				}

				return matching;
			}

			function variations_match( attrs1, attrs2 ) {
				var match = true,
					attr_name;

				for ( attr_name in attrs1 ) {
					if ( attrs1.hasOwnProperty( attr_name ) ) {
						var val1 = attrs1[ attr_name ],
							val2 = attrs2[ attr_name ];

						if ( val1 !== undefined && val2 !== undefined && val1.length !== 0 && val2.length !== 0 && val1 !== val2 ) {
							match = false;
						}
					}
				}

				return match;
			}

			function removePopup() {
				// remove the popup
				$( '.woocommerce-drop-shop-variation-popup-container' ).fadeOut( 'fast', function() {
					$( '.woocommerce-drop-shop-mask' ).fadeOut( 'fast' ).remove();
					$( '.woocommerce-drop-shop-variation-popup-container' ).remove();
				});

				setAutoHide();
				return true;
			}

			function getPopup( response ) {
				// build the variation popup container
				var variationPopup = $( response.html ),
					mask = $( '<div class="woocommerce-drop-shop-mask"></div>' );

				// hide the mask
				mask.hide();

				// append mask to body
				$( 'body' ).append( mask );

				// remove the clear selection link
				variationPopup.find( '.reset_variations' ).remove();

				// hide the popup
				variationPopup.hide();

				// append popup to body
				$( 'body' ).append( variationPopup );

				// fade mask in
				mask.fadeIn( 'fast', function() {
					// fadein popup
					variationPopup.stop( true, true ).fadeIn( 600 );
				});									

				$( variationPopup ).on( 'click', 'a.woocommerce-drop-shop-close-button', function( e ) {
					// prevent default behavior
					e.preventDefault();
					
					// remove the popup
					removePopup();
				});

				// bind click outsite of popup closes popup
				$( mask ).on( 'click', function() {
					// remove the popup
					removePopup();
				});
			}

			if ( 'no' === settings.cart_only ) {
				// set these two elements to be draggable from product page
				$( '.products .product img.wp-post-image, .attachment-shop_catalog, .attachment-shop_single, .product img.wp-post-image' ).draggable( {
					appendTo:   'body',
					helper:     'clone',
					opacity:    0.5,
					zIndex:     999999999,
					cursor:     'move',
					cursorAt:   { top: 100, left: 100 }, // centers the cursor on the image when dragged
					start: function( event, ui ) {
						ui.helper.css({
							width:'200',
							height:'200'
						});

						// clear popup container
						$( '.variation-popup-container' ).remove();

						// check if cart is not open and open it if so
						if ( mainContainer.css( 'bottom' ) !== '0' ) {
							mainContainer.removeClass( 'hide' ).addClass( 'show' );
						}

						// show hot zone
						$( '.woocommerce-drop-shop-center-wrap', mainContainer ).addClass( 'show-hot-zone' );
					},	

					drag: function( event, ui ) {

						// clear autohide when dragging
						clearAutoHide();
					},

					stop: function() {
						setAutoHide();

						// fades the items in the cart back to full opacity
						$( 'li.draggable-cart-item', mainContainer ).fadeTo( 400, '1' );

						$.woocommerce_drop_shop_scripts.runTooltip();

						$( '.woocommerce-drop-shop-center-wrap', mainContainer ).removeClass( 'show-hot-zone' );
					}
				});		

				// get the center of the draggable image
				var imageTop = $( '.draggable-cart-item img.woocommerce-drop-shop-cart-item', mainContainer ).height() / 2,
					imageLeft = $( '.draggable-cart-item img.woocommerce-drop-shop-cart-item', mainContainer ).width() / 2;

				// set the item inside the dropshop cart to be draggable
				$( '.draggable-cart-item', mainContainer ).draggable( {
					appendTo:	'body',
					opacity:	0.5,
					zIndex:		999999999,
					cursor:		'move',
					cursorAt:	{ top: imageTop, left: imageLeft }, // centers the cursor on the image when dragged
					helper:		function() {
						return $( this ).find( 'img' ).clone();	
					},

					revert: 'invalid'
				});
				
				var droppableArea = $( '.woocommerce-drop-shop-inlay', mainContainer );

				// set the drop spot in the cart and handle add to cart ajax
				droppableArea.droppable( {
					tolerance: 'pointer',
					accept: '.products .product img.wp-post-image, .product img.wp-post-image, .attachment-shop_catalog, .attachment-shop_single, .product img.wp-post-image',
					drop: function( event, ui ) {

						var productID = $( ui.draggable ).parents( '.product' ).find( '.button' ).attr( 'data-product_id' );

						$( '.woocommerce-drop-shop-dragdrop-spinner', mainContainer ).show();

						// remove variation popup
						removePopup();	

						// if product id not found - probably no add to cart button search elsewhere						
						if ( typeof productID === 'undefined' ) {
							// try to grab it from list element
							productID = $( ui.draggable ).parents( '.product' ).attr( 'class' );

							var productClass = /post-\d+/.exec( productID );
							
							productID = /\d+/.exec( productClass );

							productID = productID[0];
						}

						var data = {
							'action': 'wc_drop_shop_ajax_add_to_cart',
							'wc_drop_shop_ajax_add_to_cart': woocommerce_drop_shop_local.wc_drop_shop_ajax_add_to_cart_nonce,
							'product_id': productID
						};

						$.post( woocommerce_drop_shop_local.ajaxurl, data, function( response ) {
							response = $.parseJSON( response );

							switch( response.productType ) {
								case 'simple' :
									if ( response.added === true ) {
										$( 'body' ).trigger( 'added_to_cart' );

										if ( woocommerce_drop_shop_local.is_single === 'false' ) {
											// add the added to cart class
											$( ui.draggable ).parents( '.product' ).find( '.button' ).addClass( 'added' );
										}

										setAutoHide();

										$( '.woocommerce-drop-shop-cart-empty:visible', mainContainer ).hide();
									} else {
										getPopup( response );
										clearAutoHide();
									}
									break;									
								case 'variable' :
									getPopup( response );
									clearAutoHide();

									// get all available variations sets
									var all_variations = $( '.woocommerce-drop-shop-variation-popup-container form.variations_form' ).data( 'product_variations' );

									// when add to cart is clicked
									$( '.woocommerce-drop-shop-variation-popup-container' ).on( 'click', 'a.woocommerce-drop-shop-add-button', function( e ) {
										// prevent default behavior
										e.preventDefault();
										
										var allSelected = true;

										// loop through each select dropdown and make sure they are all set
										$( '.woocommerce-drop-shop-variation-popup-container' ).find( 'select' ).each( function() {
											// check condition
											if ( $( this ).val() === '' ) {
												allSelected = false;
												return;
											}
										});		

										// if all selected
										if ( allSelected ) {
											// remove the popup
											removePopup();

											$( '.woocommerce-drop-shop-dragdrop-spinner', mainContainer ).show();

											var current_settings = {};

											// grab each select value
											$( this ).parents( '.woocommerce-drop-shop-variation-popup-container' ).find( '.variations select' ).each( function() {
												// put each setting into array
												current_settings[ $( this ).attr( 'name' ) ] = $( this ).val();
											} );

											var matching_variations = find_matching_variations( all_variations, current_settings );
											
											var data = {
												'action': 'wc_drop_shop_ajax_add_to_cart',
												'wc_drop_shop_ajax_add_to_cart': woocommerce_drop_shop_local.wc_drop_shop_ajax_add_to_cart_nonce,
												'product_id': productID,
												'variation_id': matching_variations[0].variation_id,
												'variations': matching_variations[0].attributes
												};

											$.post( woocommerce_drop_shop_local.ajaxurl, data, function( response ) {
												response = $.parseJSON( response );
												
												if ( response.added === true ) {
													$( 'body' ).trigger( 'added_to_cart' );

												} else if ( response.added === false ) {
													getPopup( response );
												}

												setAutoHide();

												$( '.woocommerce-drop-shop-cart-empty:visible', mainContainer ).hide();
											});												
										} else {
											if ( ! $( '.woocommerce-drop-shop-variation-popup-container p.woocommerce-drop-shop-not-selected-msg' ).length ) {
												$( '.woocommerce-drop-shop-variation-popup-container' ).append( $( '<p class="woocommerce-drop-shop-not-selected-msg">' + woocommerce_drop_shop_local.select_all_options_msg + '</p>' ) );
											}
										}
									});
									break;
								case 'grouped' :
									getPopup( response );	
									setAutoHide();
									break;
								case 'external' :
									getPopup( response );
									setAutoHide();

									break;
							} // switch

							$( '.woocommerce-drop-shop-dragdrop-spinner', mainContainer ).hide();

						});				
					},	
					activeClass: 'highlight',
					hoverClass: 'highlight-over',
					over: function() {
						// fade the cart items to give visual feedback when draggable items are on the drop zone.
						$( 'li.draggable-cart-item', mainContainer ).fadeTo( 400, '0.4' );	
					}
				});

				// this makes the items in the cart not droppable in itself
				mainContainer.droppable( {
					greedy: true,
					drop: function() {
						return false;
					}
				});
							
				// set the body area to be droppable for removing cart items and handle
				// ajax remove from cart
				$( 'body' ).droppable( {
					accept: $( '.draggable-cart-item', mainContainer ),
					drop: function( event, ui ) {

						var key = $( 'form input[name=cart_id]', ui.draggable ).val(),
							productID = $( 'form input[name=product_id]', ui.draggable ).val(),
							itemQuantity = $( 'form input[name=quantity]', ui.draggable ).val(),
							data = {
								'action': 'wc_drop_shop_remove_item',
								'wc_drop_shop_ajax_remove_item': woocommerce_drop_shop_local.wc_drop_shop_ajax_remove_item_nonce,
								'cart_id': key,
								'qty': itemQuantity
							};
						
						$( '.woocommerce-drop-shop-dragdrop-spinner', mainContainer ).show();

						$.post( woocommerce_drop_shop_local.ajaxurl, data, function( response ) {
							if ( response ) {
								$( 'body' ).trigger( 'remove_item' );

								// remove any added class to products
								$( '.products .product a.add_to_cart_button[data-product_id=' + productID + ']' ).removeClass( 'added' );

								// for wootique remove view cart html as well
								$( '.products .product a.add_to_cart_button[data-product_id=' + productID + ']' ).next( 'a.added_to_cart' ).remove();
								
								setAutoHide();
							}
							
							$.woocommerce_drop_shop_scripts.runTooltip();

							$( '.woocommerce-drop-shop-dragdrop-spinner', mainContainer ).hide();
						});
					}
				});
			}

			// handle ajax remove item from cart when remove button is clicked
			$( 'a.woocommerce-drop-shop-item-remover', mainContainer ).click( function() {

				var productID = $( this ).parent().attr( 'id' ),
					key = $( '#' + productID +  ' form input[name=cart_id]' ).val(),
					itemQuantity = $( '#' + productID + ' form input[name=quantity]' ).val(),
					data = {
						'action': 'wc_drop_shop_remove_item',
						'wc_drop_shop_ajax_remove_item': woocommerce_drop_shop_local.wc_drop_shop_ajax_remove_item_nonce,
						'cart_id': key,
						'qty': itemQuantity
					};					

				$( '.woocommerce-drop-shop-dragdrop-spinner', mainContainer ).show();

				$.post( woocommerce_drop_shop_local.ajaxurl, data, function( response ) {
					if ( response ) {
						$( 'body' ).trigger( 'remove_item' );

						// remove any added class to products
						$( '.products .product a.add_to_cart_button[data-product_id=' + productID.replace( /\D/g, '' ) + ']' ).removeClass( 'added' );	

						// for wootique remove view cart html as well
						$( '.products .product a.add_to_cart_button[data-product_id=' + productID.replace( /\D/g, '' ) + ']' ).next( 'a.added_to_cart' ).remove();

						setAutoHide();
					}

					$.woocommerce_drop_shop_scripts.runTooltip();

					$( '.woocommerce-drop-shop-dragdrop-spinner', mainContainer ).hide();
				});
				
				return false;
			});	
			
			// if mouse is hovered over the cart, don't hide
			mainContainer.mouseover( function( e ) {
				e.stopPropagation();

				clearAutoHide();
			}).mouseout( function( e ) {
				e.stopPropagation();

				setAutoHide();
			});	
			
			$( document.body ).on( 'adding_to_cart', function() {
				$( '.woocommerce-drop-shop-dragdrop-spinner', mainContainer ).show();
			});
		}, // close init		
		
		runTooltip: function() {
			var mainContainer = $( '.woocommerce-drop-shop-wrapper' ),
				settings = $.parseJSON( $( '.woocommerce-drop-shop-settings', mainContainer ).val() );

			// check for tooltip
			if ( settings.show_title === 'yes' ) {
				$( '.wcds-tooltip', mainContainer ).tooltip( { 
					container: 'body', 
					placement: 'top'
				});
			}
		},

		refreshCart: function() {
			var mainContainer = $( '.woocommerce-drop-shop-wrapper' );

			// bind the add to cart refresh from WooCommerce
			$( 'body' ).on( 'added_to_cart remove_item', function( e ) {
				var data = {
					'action': 'wc_drop_shop_refresh',
					'wc_drop_shop_ajax_refresh_cart': woocommerce_drop_shop_local.wc_drop_shop_ajax_refresh_cart_nonce
				};

				$.post( woocommerce_drop_shop_local.ajaxurl, data, function( response ) {

					mainContainer.html( response.drop_shop );
					
					// reinitialize scripts
					$.woocommerce_drop_shop_scripts.init();
					$.woocommerce_drop_shop_scripts.runTooltip(); 

					// refresh the default woocommerce cart
					$( '.widget_shopping_cart' ).html( response.woocart );

					// if there are header cart info to update
					if ( response.wooheadercart.length ) {
						// artificer, wootique
						$( 'a.cart-button' ).replaceWith( response.wooheadercart );
						// mystile
						$( 'a.cart-parent' ).replaceWith( response.wooheadercart );
					}

					$( '.woocommerce-drop-shop-dragdrop-spinner', mainContainer ).hide();
					$( '.woocommerce-drop-shop-center-wrap', mainContainer ).removeClass( 'show-hot-zone' );
				});

				// user callback for adding items
				if ( e.type === 'added_to_cart' ) {
					$( 'body' ).trigger( 'adding_item' );

					mainContainer.removeClass( 'hide' ).addClass( 'show' );
				}

				// user callback for removing items
				if ( e.type === 'remove_item' ) {
					$( 'body' ).trigger( 'removing_item' );
				}
			});
		} // close refreshCart
	}; // close namespace

	$.woocommerce_drop_shop_scripts.refreshCart();
	$.woocommerce_drop_shop_scripts.init();
	$.woocommerce_drop_shop_scripts.runTooltip();
});
