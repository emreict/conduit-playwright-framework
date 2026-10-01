import { HttpInterceptorFn } from "@angular/common/http";

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const apiReq = req.clone({
    url: `https://conduit-api.bondaracademy.com/api${req.url}`,
  });
  return next(apiReq);
};
