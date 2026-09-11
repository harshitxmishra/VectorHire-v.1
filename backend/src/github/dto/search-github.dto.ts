import { IsOptional, IsString } from 'class-validator';

export class SearchGitHubDto {
  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  github?: string;
}
