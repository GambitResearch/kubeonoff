#!/usr/bin/env node

const fs = require( 'fs' )
const path = require( 'path' )
const writeFile = ( file, contents ) => fs.writeFileSync( file, contents, 'utf8' )
const classes = require( 'yargs' ).argv._
const kebabCase = require( 'lodash/kebabCase' )

const makeClass = className => {

	const kebabby = kebabCase( className )

	writeFile( path.resolve( `./src/components/${className}.js` ), `
import React from 'react'
import './${className}.css'

class ${className} extends React.Component {

	render() {
		return (
			<div className='${kebabby}'>
				Hello yes, this is dog
			</div>
		)
	}

}

const ${className} = ( props ) => (
	<div className='${kebabby}'>
		<pre>{ JSON.stringify( props, null, '  ' ) }</pre>
	</div>
)

export default ${className}
`.trim() )

	writeFile( path.resolve( `./src/components/${className}.css` ), `.${kebabby} {
\t
}
` )

}

classes.forEach( makeClass )
