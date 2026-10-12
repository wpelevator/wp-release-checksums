import { getBooleanInput, getInput } from '@actions/core';

/**
 * Read an optional string input. Empty means "not set".
 *
 * @param name Input name as defined in action.yml.
 * @return Input value, undefined when empty.
 */
function input( name: string ): string | undefined {
	return getInput( name ) || undefined;
}

/**
 * Add a flag with a value when the input is set.
 *
 * @param args  Arguments to add to.
 * @param flag  CLI flag.
 * @param value Input value.
 */
function addValue( args: string[], flag: string, value?: string ): void {
	if ( value ) {
		args.push( flag, value );
	}
}

/**
 * Add a flag when a boolean input is true. Empty means "not set", while
 * anything other than true or false fails instead of being treated as false.
 *
 * @param args Arguments to add to.
 * @param flag CLI flag.
 * @param name Input name as defined in action.yml.
 */
function addBoolean( args: string[], flag: string, name: string ): void {
	if ( getInput( name ) && getBooleanInput( name ) ) {
		args.push( flag );
	}
}

/**
 * Add the source directory and the file selection flags, which zip and
 * checksums take the same way.
 *
 * @param args Arguments to add to.
 */
function addSelection( args: string[] ): void {
	const distignore = input( 'distignore' );

	addValue( args, '--source-dir', input( 'source-dir' ) );
	addValue( args, '--slug', input( 'slug' ) );
	addValue( args, '--version', input( 'version' ) );
	addValue( args, '--filename-format', input( 'filename-format' ) );
	addValue( args, '--output', input( 'output' ) );

	if ( 'false' === distignore ) {
		args.push( '--no-distignore' );
	} else {
		addValue( args, '--distignore', distignore );
	}

	addValue( args, '--exclude', input( 'exclude' ) );
	addBoolean( args, '--exclude-gitattributes', 'exclude-gitattributes' );
}

/**
 * Map the action inputs to the arguments of "wp-release checksums". Empty
 * inputs are left out so that the wp-release defaults apply.
 *
 * @return Arguments after the command name.
 */
export function getChecksumsArgs(): string[] {
	const args: string[] = [];

	addSelection( args );
	addValue( args, '--type', input( 'type' ) );
	addBoolean( args, '--force', 'force' );

	return args;
}
