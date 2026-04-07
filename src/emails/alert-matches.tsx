import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";

interface AlertMatch {
  title: string;
  price: string | null;
  platform: string;
  url: string;
  condition: string;
}

interface AlertMatchesEmailProps {
  vehicleName: string;
  searchQuery: string;
  matches: AlertMatch[];
  alertCount: number;
}

export function AlertMatchesEmail({
  vehicleName,
  searchQuery,
  matches,
  alertCount,
}: AlertMatchesEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {`${alertCount} neue Treffer für "${searchQuery}" — ${vehicleName}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Neue Ersatzteil-Treffer</Heading>

          <Text style={text}>
            Für deinen Such-Alert &quot;<strong>{searchQuery}</strong>&quot; ({vehicleName})
            wurden {alertCount} neue Treffer gefunden:
          </Text>

          {matches.slice(0, 10).map((match, i) => (
            <Section key={i} style={matchBox}>
              <Text style={matchTitle}>
                <Link href={match.url} style={matchLink}>
                  {match.title}
                </Link>
              </Text>
              <Text style={matchMeta}>
                {match.price ?? "Preis n.A."} · {match.condition} · {match.platform}
              </Text>
            </Section>
          ))}

          {alertCount > 10 && (
            <Text style={text}>
              ...und {alertCount - 10} weitere Treffer.
            </Text>
          )}

          <Hr style={hr} />

          <Text style={footerText}>
            Du erhältst diese E-Mail, weil du einen Such-Alert für &quot;{searchQuery}&quot; erstellt hast.
            Deaktiviere den Alert in deinem Konto, um keine weiteren E-Mails zu erhalten.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "8px",
  maxWidth: "480px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  margin: "0 0 24px",
};

const text = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#4a4a4a",
  margin: "0 0 16px",
};

const matchBox = {
  backgroundColor: "#f0f4f8",
  borderRadius: "6px",
  padding: "12px 16px",
  margin: "0 0 8px",
};

const matchTitle = {
  fontSize: "14px",
  fontWeight: "500" as const,
  color: "#1a1a1a",
  margin: "0 0 4px",
};

const matchLink = {
  color: "#0066cc",
  textDecoration: "none",
};

const matchMeta = {
  fontSize: "13px",
  color: "#6a6a6a",
  margin: "0",
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "24px 0",
};

const footerText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#8a8a8a",
  margin: "0 0 8px",
};

export default AlertMatchesEmail;
