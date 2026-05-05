import { NextFunction, Request, Response } from "express";
import z from "zod";

export const validateRequest = (zodSchema: z.ZodType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const shouldValidateRequestObject = zodSchema instanceof z.ZodObject
            && ["body", "params", "query"].some((key) => key in zodSchema.shape);

        const parsedResult = zodSchema.safeParse(
            shouldValidateRequestObject
                ? {
                    body: req.body,
                    params: req.params,
                    query: req.query,
                }
                : req.body
        )

        if (!parsedResult.success) {
            return next(parsedResult.error)
        }

        if (shouldValidateRequestObject) {
            const sanitizedRequest = parsedResult.data as {
                body?: Request["body"];
                params?: Request["params"];
                query?: Request["query"];
            };

            if (sanitizedRequest.body !== undefined) {
                req.body = sanitizedRequest.body;
            }

            if (sanitizedRequest.params !== undefined) {
                req.params = sanitizedRequest.params as Request["params"];
            }

            if (sanitizedRequest.query !== undefined) {
                const currentQuery = req.query as Record<string, unknown>;
                const sanitizedQuery = sanitizedRequest.query as Record<string, unknown>;

                for (const key of Object.keys(currentQuery)) {
                    delete currentQuery[key];
                }

                Object.assign(currentQuery, sanitizedQuery);
            }
        } else {
            //sanitizing the data
            req.body = parsedResult.data;
        }

        return next();
    }
}
