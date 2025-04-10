/**
 * Testy pro cacheMiddleware
 */

const { setCacheHeaders, staticCache, shortCache, noCache } = require('../../middleware/cacheMiddleware');

describe('Cache Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      set: jest.fn()
    };
    next = jest.fn();
  });

  describe('setCacheHeaders', () => {
    it('should set default cache headers when no options provided', () => {
      const middleware = setCacheHeaders();
      middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store, no-cache, must-revalidate');
      expect(res.set).toHaveBeenCalledWith('Pragma', 'no-cache');
      expect(res.set).toHaveBeenCalledWith('Expires', '0');
      expect(res.set).toHaveBeenCalledWith('ETag', false);
      expect(next).toHaveBeenCalled();
    });

    it('should set max-age when maxAge option is provided', () => {
      const middleware = setCacheHeaders({ maxAge: 3600 });
      middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600');
      expect(next).toHaveBeenCalled();
    });

    it('should not disable ETag when etag option is true', () => {
      const middleware = setCacheHeaders({ etag: true });
      middleware(req, res, next);

      expect(res.set).not.toHaveBeenCalledWith('ETag', false);
      expect(next).toHaveBeenCalled();
    });

    it('should set custom Cache-Control when cacheControl option is provided', () => {
      const middleware = setCacheHeaders({ cacheControl: 'private, max-age=300' });
      middleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'private, max-age=300');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Predefined middlewares', () => {
    it('staticCache should set long cache with ETag', () => {
      staticCache(req, res, next);

      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600');
      expect(res.set).not.toHaveBeenCalledWith('ETag', false);
      expect(next).toHaveBeenCalled();
    });

    it('shortCache should set short cache with ETag', () => {
      shortCache(req, res, next);

      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=60');
      expect(res.set).not.toHaveBeenCalledWith('ETag', false);
      expect(next).toHaveBeenCalled();
    });

    it('noCache should disable all caching', () => {
      noCache(req, res, next);

      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store, no-cache, must-revalidate');
      expect(res.set).toHaveBeenCalledWith('Pragma', 'no-cache');
      expect(res.set).toHaveBeenCalledWith('Expires', '0');
      expect(res.set).toHaveBeenCalledWith('ETag', false);
      expect(next).toHaveBeenCalled();
    });
  });
});
