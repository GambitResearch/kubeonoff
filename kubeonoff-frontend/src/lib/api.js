export const request = async ( url, options ) => {

	const wholeURL = `${window.location.origin}${window.location.pathname}${url.replace(/^\//,'')}`

	const response = await fetch( wholeURL, {
		credentials: 'include',
		...options
	} )

	if ( !response.ok ) {
		throw new Error( await response.text() )
	}

	const contentType = response.headers.get( 'content-type' )
	if ( contentType && contentType.includes( 'application/json' ) ) {
		return response.json()
	}

	return response.text()
}

window.request = request

export const extensionRequest = ( extension, url, options ) => request( `/v1/kubeonoff/extensions/${extension}${url}`, options )

const convenienceMethods = [ 'GET', 'POST', 'DELETE', 'PUT', 'PATCH' ]
convenienceMethods.forEach( method => request[ method ] = ( url, options ) => request( url, {
	method,
	...options
} ) )
convenienceMethods.forEach( method => extensionRequest[ method ] = ( extension, url, options ) => extensionRequest( extension, url, {
	method,
	...options
} ) )

export const getAll = () => request.GET( '/v1/all' )

export const on = name => request.POST( `/v1/deployments/${name}/on` )

export const off = name => request.POST( `/v1/deployments/${name}/off` )

export const restart = name => request.POST( `/v1/deployments/${name}/restart` )

export const deletePod = name => request.DELETE( `/v1/pods/${name}` )

export const getPodLog = ( name, container, timestamps = false ) => request.GET( `/v1/pods/${name}/${container}/log${timestamps ? '?timestamps=true' : ''}` )

export const getExtensions = () => request.GET( '/v1/kubeonoff/extensions' )

export const getExtensionControls = extension => extensionRequest.GET( extension, '/controls' )
