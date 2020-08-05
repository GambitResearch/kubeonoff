import React from 'react'
import './Extensions.css'

import Extension from './Extension'

const Extensions = ( {
		extensions
	} ) => {

	if ( !extensions || !extensions.length )
		return null

	const extensionItems = extensions.map( e => (
		<Extension
			key={ e.name }
			extension={ e } />
	) )

	return (
		<div className='extensions'>
			{ extensionItems }
		</div>
	)
}

export default Extensions
