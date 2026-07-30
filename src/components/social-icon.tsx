import {
  Facebook,
  Github,
  Instagram,
  Linkedin,
  Link as LinkIcon,
  Twitter,
  Youtube,
} from "lucide-react";

export function SocialIcon({ iconKey, className = "h-4 w-4" }: { iconKey: string; className?: string }) {
  switch (iconKey) {
    case "linkedin":
      return <Linkedin className={className} />;
    case "twitter":
      return <Twitter className={className} />;
    case "youtube":
      return <Youtube className={className} />;
    case "instagram":
      return <Instagram className={className} />;
    case "facebook":
      return <Facebook className={className} />;
    case "github":
      return <Github className={className} />;
    default:
      return <LinkIcon className={className} />;
  }
}
