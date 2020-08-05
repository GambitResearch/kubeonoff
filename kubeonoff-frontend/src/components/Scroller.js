import React from 'react'
import './Scroller.css'

const Scroller = ( {
		children,
		className='',
		onScroll,
		style
	} ) => (
	<div
		className={ `scroller ${className}` }
		onScroll={ onScroll }
		style={ style }>
		<div className='scroller-inner'>
			{ children }
		</div>
	</div>
)

export default Scroller
