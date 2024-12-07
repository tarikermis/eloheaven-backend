import express, { Request, Response } from 'express';
import asyncHandler from '@helpers/asyncHandler';
import BlogPostRepo from '@database/repository/BlogPostRepo';

interface BlogPost {
  language: string;
  slug: string;
}

interface PostsByLanguage {
  [key: string]: BlogPost[];
}

interface ResponseItem {
  loc: string;
  _sitemap: string;
}

const router = express.Router();

const paginationPaths: { [key: string]: string } = {
  en: 'blog/page/[page]',
  de: 'blog/seite/[page]',
  fr: 'blog/page/[page]',
  es: 'blog/pagina/[page]',
  nl: 'blog/pagina/[page]',
  it: 'blog/pagina/[page]',
  pt: 'blog/pagina/[page]',
  zh: 'blog/ye/[page]',
  ar: 'blog/safha/[page]',
};

router.get(
  '/blog',
  asyncHandler(async (req: Request, res: Response) => {
    // Fetch all blog posts
    const blogPosts: BlogPost[] = await BlogPostRepo.findAll();

    // Group blog posts by language
    const postsByLanguage: PostsByLanguage = blogPosts.reduce(
      (acc: PostsByLanguage, post: BlogPost) => {
        if (!acc[post.language]) {
          acc[post.language] = [];
        }
        acc[post.language].push(post);
        return acc;
      },
      {},
    );

    // Build response
    const response: ResponseItem[] = [];

    // Add blog post URLs and pagination URLs per language
    Object.keys(postsByLanguage).forEach((language) => {
      const posts = postsByLanguage[language];
      const totalDocs = posts.length;
      const limit = 12;
      const totalPages = Math.ceil(totalDocs / limit);
      // Determine the locale prefix
      const localePrefix =
        language === 'en_US' ? '' : `${language.substring(0, 2)}/`;

      // Add blog post URLs
      posts.forEach((post) => {
        response.push({
          loc: `${localePrefix}blog/${post.slug}`,
          _sitemap: language,
        });
      });

      // Add pagination URLs
      for (let i = 1; i <= totalPages; i++) {
        const paginationPath =
          paginationPaths[language.substring(0, 2)] || paginationPaths['en'];
        response.push({
          loc: `${localePrefix}${paginationPath.replace(
            '[page]',
            i.toString(),
          )}`,
          _sitemap: language,
        });
      }
    });

    // Send response directly
    res.json(response);
  }),
);

export default router;
