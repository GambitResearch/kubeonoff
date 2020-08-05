import React from 'react'
import qs from 'query-string'
import './ModeSpecificContent.css'


const ModeSpecificContent = ( props ) => {
	let mode = null

	try {
		mode = qs.parse( window.location.search ).mode
	} catch (err) {
		// Noice
	}

	const parrotBonus = mode === 'parrot'? (
		<iframe
			title='parrot'
			width='1'
			height='1'
			src='https://www.youtube.com/embed/dv13gl0a-FA?start=64&autoplay=1'
			frameBorder='0'
			allowFullScreen></iframe> ) : null
	document.body.dataset.mode = mode

	return parrotBonus
}

export default ModeSpecificContent
