import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getChecksumsArgs } from './inputs.ts';
import { withEnv } from './test-env.ts';

test( 'passes nothing for empty inputs', () => {
	assert.deepEqual(
		withEnv( { INPUT_SLUG: '', INPUT_FORCE: '' }, getChecksumsArgs ),
		[],
		'Empty inputs should leave the wp-release defaults in place.'
	);
} );

test( 'maps inputs to wp-release checksums flags', () => {
	assert.deepEqual(
		withEnv(
			{
				'INPUT_SOURCE-DIR': 'dist',
				INPUT_SLUG: 'my-theme',
				INPUT_TYPE: 'theme',
				INPUT_DISTIGNORE: 'false',
				'INPUT_EXCLUDE-GITATTRIBUTES': 'true',
				INPUT_FORCE: 'true',
			},
			getChecksumsArgs
		),
		[
			'--source-dir',
			'dist',
			'--slug',
			'my-theme',
			'--no-distignore',
			'--exclude-gitattributes',
			'--type',
			'theme',
			'--force',
		],
		'Each set input should map to its CLI flag.'
	);
} );
