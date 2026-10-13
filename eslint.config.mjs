import config from '@wordpress/scripts/config/eslint.config.cjs';

// The default config of wp-scripts, without the bundle that the build writes.
export default [ { ignores: [ 'dist/' ] }, ...config ];
