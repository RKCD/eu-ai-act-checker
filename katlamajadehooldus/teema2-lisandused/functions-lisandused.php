<?php
/**
 * FAAS 1 lisandused lapsteema functions.php faili.
 * Kleebi see plokk olemasoleva functions.php faili LÕPPU (mitte üle
 * kirjutades midagi olemasolevat). Sisaldab ülesandeid 1.2, 1.6, 1.7.
 */

/* ---------------------------------------------------------------------
 * 1.2 — Kleepuv helista/broneeri riba mobiilis.
 * Renderdatakse kõigile, peidetakse CSS-iga desktopis — nii ei riku
 * vahemälu (varying markup by device would break page caching, CSS-only
 * hiding does not).
 * ------------------------------------------------------------------- */
add_action( 'wp_footer', 'khk_sticky_callbar', 20 );
function khk_sticky_callbar() {
	if ( is_admin() ) {
		return;
	}
	?>
	<div class="khk-callbar" role="region" aria-label="Kiirkontakt">
		<a class="khk-callbar__btn khk-callbar__btn--call"
		   href="tel:+3725057556" data-khk="call-sticky">
			Helista 505 7556
		</a>
		<a class="khk-callbar__btn khk-callbar__btn--book"
		   href="/gaasikatla-hooldus/#broneeri" data-khk="book-sticky">
			Broneeri hooldus
		</a>
	</div>
	<?php
}

/* ---------------------------------------------------------------------
 * 1.6 — Mõõtmine: call_click ja generate_lead sündmused GA4/GTM-i jaoks.
 * ------------------------------------------------------------------- */
add_action( 'wp_footer', 'khk_tracking', 30 );
function khk_tracking() {
	?>
	<script>
	(function () {
		function send( name, params ) {
			if ( typeof gtag === 'function' ) { gtag( 'event', name, params ); }
			window.dataLayer = window.dataLayer || [];
			window.dataLayer.push( Object.assign( { event: name }, params ) );
		}
		document.addEventListener( 'click', function ( e ) {
			var t = e.target;
			if ( ! t || ! t.closest ) { return; }
			var a = t.closest( 'a[href^="tel:"]' );
			if ( ! a ) { return; }
			send( 'call_click', {
				link_url: a.getAttribute( 'href' ),
				placement: a.dataset.khk || 'muu'
			} );
		} );
		document.addEventListener( 'wpcf7mailsent', function ( e ) {
			send( 'generate_lead', { form_id: e.detail.contactFormId } );
		} );
	})();
	</script>
	<?php
}

/* ---------------------------------------------------------------------
 * 1.7 — Jaluse aastaarv dünaamiliseks, ei vanane enam.
 * Kasutus lapsteema jaluse mallis (footer.php vms) või laienda
 * olemasolevat jaluse teksti stringi selle funktsiooniga:
 *   echo khk_footer_copyright();
 * ------------------------------------------------------------------- */
function khk_footer_copyright() {
	return sprintf(
		'&copy; %s Katlamajade Hooldus O&Uuml;',
		esc_html( date( 'Y' ) )
	);
}
