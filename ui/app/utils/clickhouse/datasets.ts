import { z } from "zod";
import {
  contentBlockOutputSchema,
  inputSchema,
  jsonInferenceOutputSchema,
} from "./common";
import type { ParsedInferenceRow } from "./inference";

/**
 * Schema representing a fully-qualified row in the Chat Inference dataset.
 */
export const ChatInferenceDatapointRowSchema = z
  .object({
    dataset_name: z.string(),
    function_name: z.string(),
    id: z.string().uuid(),
    episode_id: z.string().uuid(),
    input: z.string(),
    output: z.string().nullable(),
    tool_params: z.string(),
    tags: z.record(z.string(), z.string()),
    auxiliary: z.string(),
    is_deleted: z.boolean().default(false),
    updated_at: z.string().datetime().default(new Date().toISOString()),
  })
  .strict();
export type ChatInferenceDatapointRow = z.infer<
  typeof ChatInferenceDatapointRowSchema
>;

/**
 * Schema representing a fully-qualified row in the JSON Inference dataset.
 */
export const JsonInferenceDatapointRowSchema = z
  .object({
    dataset_name: z.string(),
    function_name: z.string(),
    id: z.string().uuid(),
    episode_id: z.string().uuid(),
    input: z.string(),
    output: z.string().nullable(),
    output_schema: z.string(),
    tags: z.record(z.string(), z.string()),
    auxiliary: z.string(),
    is_deleted: z.boolean().default(false),
    updated_at: z.string().datetime(),
  })
  .strict();
export type JsonInferenceDatapointRow = z.infer<
  typeof JsonInferenceDatapointRowSchema
>;

/**
 * Union schema representing a dataset row, which can be either a Chat or JSON inference row.
 */
export const DatapointRowSchema = z.union([
  ChatInferenceDatapointRowSchema,
  JsonInferenceDatapointRowSchema,
]);
export type DatapointRow = z.infer<typeof DatapointRowSchema>;

export const ParsedChatInferenceDatapointRowSchema =
  ChatInferenceDatapointRowSchema.omit({
    input: true,
    output: true,
    tool_params: true,
  }).extend({
    input: inputSchema,
    output: z.array(contentBlockOutputSchema).optional(),
    tool_params: z.record(z.string(), z.unknown()),
    tags: z.record(z.string(), z.string()),
  });
export type ParsedChatInferenceDatapointRow = z.infer<
  typeof ParsedChatInferenceDatapointRowSchema
>;

export const ParsedJsonInferenceDatapointRowSchema =
  JsonInferenceDatapointRowSchema.omit({
    input: true,
    output: true,
    output_schema: true,
  }).extend({
    input: inputSchema,
    output: jsonInferenceOutputSchema.optional(),
    output_schema: z.record(z.string(), z.unknown()),
  });
export type ParsedJsonInferenceDatapointRow = z.infer<
  typeof ParsedJsonInferenceDatapointRowSchema
>;

/**
 * Union schema representing a parsed dataset row, which can be either a Chat or JSON inference row.
 */
export const ParsedDatasetRowSchema = z.union([
  ParsedChatInferenceDatapointRowSchema,
  ParsedJsonInferenceDatapointRowSchema,
]);
export type ParsedDatasetRow = z.infer<typeof ParsedDatasetRowSchema>;

/**
 * Schema for inserts into the Chat Inference dataset.
 * Note: "is_deleted" and "created_at" are omitted since they are generated by the database.
 */
export const ChatInferenceDatapointInsertSchema =
  ChatInferenceDatapointRowSchema.omit({
    is_deleted: true,
    updated_at: true,
  });
export type ChatInferenceDatapointInsert = z.infer<
  typeof ChatInferenceDatapointInsertSchema
>;

/**
 * Schema for inserts into the JSON Inference dataset.
 * Note: "is_deleted" and "created_at" are omitted since they are generated by the database.
 */
export const JsonInferenceDatapointInsertSchema =
  JsonInferenceDatapointRowSchema.omit({
    is_deleted: true,
    updated_at: true,
  });
export type JsonInferenceDatapointInsert = z.infer<
  typeof JsonInferenceDatapointInsertSchema
>;

/**
 * Union schema representing an insert into either dataset.
 */
export const DatapointInsertSchema = z.union([
  ChatInferenceDatapointInsertSchema,
  JsonInferenceDatapointInsertSchema,
]);
export type DatapointInsert = z.infer<typeof DatapointInsertSchema>;

/**
 * Schema defining the allowed query parameters for selecting rows from the dataset.
 */
export const DatasetQueryParamsSchema = z.object({
  inferenceType: z.enum(["chat", "json"]),
  function_name: z.string().optional(),
  dataset_name: z.string().optional(),
  variant_name: z.string().optional(), // variant_name must have a corresponding function_name
  extra_where: z.string().array().default([]), // Extra WHERE clauses (e.g. filtering by episode_id)
  extra_params: z
    .record(z.string(), z.union([z.string(), z.number()]))
    .default({}), // Additional query parameters for placeholder substitution
  metric_filter: z
    .object({
      metric: z.string(),
      metric_type: z.enum(["boolean", "float"]),
      operator: z.enum([">", "<"]),
      threshold: z.number(),
      join_on: z.enum(["id", "episode_id"]),
    })
    .optional(), // Optional filter based on metric feedback
  output_source: z.enum(["none", "inference", "demonstration"]),
  limit: z.number().optional(),
  offset: z.number().optional(),
});
export type DatasetQueryParams = z.infer<typeof DatasetQueryParamsSchema>;

export const DatasetCountInfoSchema = z.object({
  dataset_name: z.string(),
  count: z.number(),
  last_updated: z.string().datetime(),
});
export type DatasetCountInfo = z.infer<typeof DatasetCountInfoSchema>;

export const DatasetDetailRowSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["chat", "json"]),
  function_name: z.string(),
  episode_id: z.string().uuid(),
  updated_at: z.string().datetime(),
});

export type DatasetDetailRow = z.infer<typeof DatasetDetailRowSchema>;

/**
 * Converts a ParsedInferenceRow to a ParsedDatasetRow format.
 * This is useful when you want to convert inference data into a dataset-compatible format.
 */
export function inferenceRowToDatasetRow(
  inference: ParsedInferenceRow,
  dataset_name: string,
): ParsedDatasetRow {
  const baseFields = {
    dataset_name,
    function_name: inference.function_name,
    id: inference.id,
    episode_id: inference.episode_id,
    input: inference.input,
    tags: inference.tags,
    auxiliary: JSON.stringify({}),
    is_deleted: false,
    updated_at: new Date().toISOString(),
  };

  if (inference.function_type === "chat") {
    return {
      ...baseFields,
      output: inference.output,
      tool_params: inference.tool_params,
    };
  } else {
    return {
      ...baseFields,
      output: inference.output,
      output_schema: inference.output_schema,
    };
  }
}
