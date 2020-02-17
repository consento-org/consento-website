# Consento-theme

This is Consento, a theme for the consento-org homepage. 
based on the awesome [Editorial](https://github.com/TryGhost/Editorial.git) template.

&nbsp;

![screenshot](https://user-images.githubusercontent.com/120485/49328081-0e192680-f59d-11e8-808a-e6d6bcfa8419.png)


&nbsp;

# First time using a Ghost theme?

Ghost uses a simple templating language called [Handlebars](http://handlebarsjs.com/) for its themes.

We've documented our default theme pretty heavily so that it should be fairly easy to work out what's going on just by reading the code and the comments. Once you feel comfortable with how everything works, we also have full [theme API documentation](https://themes.ghost.org) which explains every possible Handlebars helper and template.

**The main files are:**

- `default.hbs` - The main template file
- `index.hbs` - Used for the home page
- `post.hbs` - Used for individual posts
- `page.hbs` - Used for individual pages
- `tag.hbs` - Used for tag archives
- `author.hbs` - Used for author archives

One neat trick is that you can also create custom one-off templates just by adding the slug of a page to a template file. For example:

- `page-about.hbs` - Custom template for the `/about/` page
- `tag-news.hbs` - Custom template for `/tag/news/` archive
- `author-ali.hbs` - Custom template for `/author/ali/` archive


# Development

This implementation tries to stay as true as possible to the original template without making too many modifications. The original code is unmodified, preserving the ability to update it later.

There are two main changes compared to the original template files:

- The original template contained separate `/assets` and `/images` directories. Ghost Themes require that all assets be nested under a top-level `/assets` directory, so these are moved to `/assets/main` and `/assets/images`, respectively.
- In order to make minor modifications and add some new custom styles, one additional SaSS file is added under `/assets/main/sass/layout/ghost.sass` and included at the bottom of the `main.sass` file.

To work on styles in this theme, you'll need to run a local development environment to build/watch for changes. Once cloned and installed with npm, the following `gulp` build tasks are available:

```bash
# Build files locally and watch for changes
npm run dev

# Build production zip locally and save to /dist
npm run zip

# Run compatibility test against latest version of Ghost
npm test
```

Original template files and design by [@ajlkn](https://twitter.com/ajlkn)


# Modify code block in Technology section

If you need to modify the code block in the Technology section, take the following steps:

1) Install @leichtgewicht/prism-cli using `npm install @leichtgewicht/prism-cli -g` or, if using `npx`, you can use `npx @leichtgewicht/prism-cli`

2) Paste the code you want to show into a text file and save that file.

3) run the following command: `npx @leichtgewicht/prism-cli -f {filename.extension} --html -l typescript`

The `{filename.extension}` is the name of your file, such as `codeblock.ts`. `--html` is the tag used to generate the response as html code. `-l` is the language you want; in this case it would be typescript. 

This will generate your codeblock using HTML code. It will include classes used in the [official prism templates.](https://github.com/PrismJS/prism/tree/master/themes) Just generate a new scss file and paste that css code in there.

# Copyright & License

Copyright (c) 2013-2019 [HTML5 UP](https://htmlup.net) & [Ghost Foundation](https://ghost.org) - This theme is licensed under both the [MIT and Creative Commons Attribution 3.0](LICENSE). Please note that the terms of the Creative Commons license require that you maintain the footer attribution to freely use this theme.
